const { MongoClient } = require('mongodb');

// O cache da conexão evita abrir um novo pool no MongoDB a cada voto
let cachedDb = null;

async function connectToDatabase(uri) {
  if (cachedDb) return cachedDb;
  
  const client = await MongoClient.connect(uri);
  // Substitua 'nutrivota' pelo nome real do seu banco de dados no Atlas
  cachedDb = client.db('nutrivota'); 
  return cachedDb;
}

exports.handler = async (event, context) => {
  // 1. Verificação de Segurança (Netlify Identity)
  const { user } = context.clientContext;

  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Acesso negado. Faça login para votar." }),
    };
  }

  const userEmail = user.email;

  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Método não permitido" };
    }

    const { date, meal, itemTitle, voteType } = JSON.parse(event.body);

    // 2. Conexão com o Banco de Dados
    const db = await connectToDatabase(process.env.MONGODB_URI);
    const votesCollection = db.collection('votes');

    // 3. Regra de Negócio: Atualiza se já existir (upsert), insere se for novo.
    // Isso garante que um aluno não consiga votar duas vezes na mesma comida do mesmo dia.
    const filter = { userEmail, date, meal, itemTitle };
    const update = { 
      $set: { 
        voteType, 
        updatedAt: new Date() 
      } 
    };
    const options = { upsert: true };

    await votesCollection.updateOne(filter, update, options);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Voto computado e salvo com sucesso!" }),
    };

  } catch (error) {
    console.error("Erro no banco de dados:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno no servidor ao salvar o voto." }),
    };
  }
};