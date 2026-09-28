// public/js/api.js

async function submitVote(date, meal, itemTitle, voteType) {
  // Pega o token de autenticação gerado pelo widget do Netlify Identity
  const user = netlifyIdentity.currentUser();
  
  if (!user) {
    alert("Você precisa estar logado!");
    return;
  }

  // Gera um token JWT atualizado
  const token = await user.jwt();

  try {
    const response = await fetch('/.netlify/functions/cast-vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Aqui enviamos a carteirinha de estudante (token) para o backend!
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ date, meal, itemTitle, voteType })
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.error);
    
    console.log("Sucesso:", result.message);
    // Aqui você chama a função do ui.js para atualizar a tela (ex: mostrar os coraçõezinhos cheios)

  } catch (error) {
    console.error("Erro ao votar:", error);
    alert(error.message);
  }
}