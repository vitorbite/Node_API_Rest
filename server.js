const express = require("express");
const app = express();
const PORT = 3001;
app.use(express.json());
const produtos = [];
let idCounter = 1;

function validarNome(nome) {
  return typeof nome === "string" && nome.trim().length > 0;
}

app.post("/produtos", (req, res) => {
  try {
    const { nome } = req.body;

    if (!validarNome(nome)) {
      return res.status(400).json({
        erro: "O campo 'nome' é obrigatório e deve ser uma string válida.",
      });
    }
    const novoProduto = { id: idCounter, nome };
    produtos.push(novoProduto);

    res.status(201).json(novoItem);
  } catch (error) {
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

app.get("/produtos", (req, res) => {
  res.json(produtos);
});

app.get("/produtos/:id", (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ erro: "ID inválido." });
  }

  const item = produtos.find((produto) => (produto.id = id));
  if (!item) {
    return res.status(404).json({ erro: "Item não encontrado." });
  }

  res.json(item);
});

app.put("/produtos", (req, res) => {});

app.delete("/produtos", (req, res) => {});

app.listen(PORT, () => {
  console.log("Servidor iniciado na porta: " + PORT);
});
