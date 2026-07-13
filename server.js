const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3001;
const connection = require("./sqlConnection");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const { body, param, validationResult } = require("express-validator");

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limita cada IP a 100 requisições por 'window'
  message: {
    erro: "Muitas requisições vindas deste IP, tente novamente mais tarde.",
  },
});

app.use(limiter);

const verificarErrosValidacao = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ erros: errors.array() });
  }
  next();
};

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "form.html"));
});

app.post(
  "/produtos",
  [
    body("nome").trim().isLength({ min: 1, max: 255 }).escape(),
    body("descricao").trim().isLength({ max: 1000 }).escape(),
  ],
  verificarErrosValidacao,
  (req, res) => {
    const { nome, descricao } = req.body;

    const sql = "INSERT INTO produto (nome, descricao) VALUES (?, ?);";
    connection.query(sql, [nome.trim(), descricao.trim()], (error, result) => {
      if (error) {
        console.error("Erro ao inserir produto:", error);
        return res
          .status(500)
          .json({ erro: "Erro ao inserir no banco de dados." });
      }

      const novoProduto = {
        id: result.insertId,
        nome,
        descricao,
      };
      res.status(201).json(novoProduto);
    });
  },
);

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

app.put(
  "/produtos/:id",
  [
    param("id").isInt().toInt(),
    body("nome").trim().isLength({ min: 1, max: 255 }).toLowerCase().escape(),
    body("descricao").trim().isLength({ max: 1000 }).toLowerCase().escape(),
  ],
  verificarErrosValidacao,
  (req, res) => {
    const { id } = req.params;
    const { nome, descricao } = req.body;

    const sql = "UPDATE produto SET nome = ?, descricao = ? WHERE id = ?";
    connection.query(sql, [nome, descricao, id], (error, result) => {
      if (error) {
        console.error("Erro ao atualizar produto:", error);
        return res.status(500).json({ erro: "Erro ao atualizar o produto." });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ erro: "Item não encontrado." });
      }

      res.json({ id, nome, descricao });
    });
  },
);

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
