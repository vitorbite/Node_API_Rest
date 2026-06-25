const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json());
const connection = require("./sqlConnection");

app.use(express.urlencoded({ extended: true }));

function validarNome(nome) {
  return typeof nome === "string" && nome.trim().length > 0;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'form.html'));
});

app.post("/produtos", (req, res) => {
  const {nome} = req.body;

  if (!validarNome(nome)) {
    return res.status(400).json({
      erro: "O campo 'nome' é obrigatório e deve ser uma string válida.",
    });
  }

  const sql = "INSERT INTO produto (nome) VALUES (?);";
  connection.query(sql, [nome.trim()], (error, result) => {
    if (error) {
      console.error("Erro ao inserir produto:", error);
      return res.status(500).json({ erro: "Erro ao inserir no banco de dados." });
    }

    const novoProduto = { id: result.insertId, nome: nome.trim() };
    res.status(201).json(novoProduto);
  });
});

app.get("/produtos", (req, res) => {
  const sql = "SELECT * FROM produto";
  connection.query(sql, (error, results) => {
    if (error) {
      console.error("Erro ao buscar produtos:", error);
      return res.status(500).json({ erro: "Erro ao buscar produtos." });
    }
    res.json(results);
  });
});

app.get("/produtos/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ erro: "ID inválido." });
  }

  const sql = "SELECT * FROM produto WHERE id = ?";
  connection.query(sql, [id], (error, results) => {
    if (error) {
      console.error("Erro ao buscar produto:", error);
      return res.status(500).json({ erro: "Erro ao buscar o produto." });
    }

    if (results.length === 0) {
      return res.status(404).json({ erro: "Item não encontrado." });
    }

    res.json(results[0]);
  });
});

app.put("/produtos/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ erro: "ID inválido." });
  }

  const { nome } = req.body;

  if (!validarNome(nome)) {
    return res.status(400).json({ erro: "O campo 'nome' é obrigatório e deve ser uma string válida." });
  }

  const sql = "UPDATE produto SET nome = ? WHERE id = ?";
  connection.query(sql, [nome.trim(), id], (error, result) => {
    if (error) {
      console.error("Erro ao atualizar produto:", error);
      return res.status(500).json({ erro: "Erro ao atualizar o produto." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Item não encontrado." });
    }

    res.json({ id, nome: nome.trim() });
  });
});

app.delete("/produtos/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ erro: "ID inválido." });
  }

  const sql = "DELETE FROM produto WHERE id = ?";
  connection.query(sql, [id], (error, result) => {
    if (error) {
      console.error("Erro ao remover produto:", error);
      return res.status(500).json({ erro: "Erro ao remover o produto." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Item não encontrado." });
    }

    res.json({ mensagem: "Item removido com sucesso.", id });
  });
});

app.listen(PORT, () => {
  console.log("Servidor iniciado na porta: " + PORT);
});


process.on("SIGINT", () => {
  connection.end((err) => {
    if (err) {
      console.error("Erro ao fechar conexão MySQL:", err);
      process.exit(1);
    }
    console.log("Conexão MySQL finalizada.");
    process.exit(0);
  });
});