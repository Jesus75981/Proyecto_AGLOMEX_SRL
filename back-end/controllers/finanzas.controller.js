const getTransactions = (req, res) => {
  // Datos de ejemplo para simular la respuesta de la base de datos
  const transactions = [
    { id: 1, type: 'ingreso', description: 'Venta de productos', amount: 500.00, date: '2023-10-25' },
    { id: 2, type: 'egreso', description: 'Compra de materia prima', amount: 150.75, date: '2023-10-24' },
    { id: 3, type: 'ingreso', description: 'Venta de servicios', amount: 200.00, date: '2023-10-23' },
  ];
  // Envía los datos como una respuesta JSON al frontend
  res.json(transactions);
};

module.exports = {
  getTransactions
};
