const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Ccm272104!',
  database: 'CliniVida' // agora usando o novo banco
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar:', err);
    return;
  }
  console.log('Conectado ao MySQL!');
});

// ...existing code...
  console.log('Conectado ao MySQL!');

  // Inserir um paciente
  const sql = "INSERT INTO paciente (cod, nome, email, fone) VALUES (?, ?, ?, ?)";
  const values = [1, 'Maria Silva', 'maria@email.com', '11999999999'];

  connection.query(sql, values, (err, result) => {
    if (err) throw err;
    console.log('Paciente inserido!');
    connection.end(); // Fecha a conexão após inserir
  });
// ...existing code...