const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../front-end/src/assets/pages/InventarioPage.jsx');

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Keep lines 0 to 959 (which corresponds to line numbers 1 to 960)
    // Line 960 is: </td>
    // So we keep up to index 959 inclusive.
    const validLines = lines.slice(0, 960);

    const tail = `                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Contenido de Movimientos */}
          {activeTab === 'movimientos' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Historial de Movimientos</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {movimientosFiltrados.map((mov) => (
                        <tr key={mov._id || mov.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(mov.fecha).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{mov.producto?.nombre || 'Producto desconocido'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={\`px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${mov.tipo === 'Entrada' ? 'bg-green-100 text-green-800' :
                              mov.tipo === 'Salida' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }\`}>
                              {mov.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{mov.cantidad}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mov.motivo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mov.usuario}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Imagen */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
          <div className="max-w-3xl max-h-full p-4">
            <img src={selectedImage} alt="Producto grande" className="max-w-full max-h-[90vh] rounded-lg shadow-xl" />
          </div>
        </div>
      )}
    </div>
  );
};

export default InventarioPage;
`;

    const finalContent = validLines.join('\n') + '\n' + tail;

    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log('Successfully repaired InventarioPage.jsx with absolute tail');

} catch (err) {
    console.error('Error repairing file:', err);
}
