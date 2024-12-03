const fs = require('fs');
const express = require("express");
const app = express();
const mysql = require("mysql");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { subtle } = require("crypto");
const https = require('https');


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//GUARDAR IMAGENES

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './Imagenes/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '230304',
    database: 'bdelectronica'
});


app.get("/", (req, res) => {
  console.log('Servidor corriendo a la perfección');
  res.send('Servidor corriendo a la perfección');
});

  
// GESTIÓN DE USUARIOS
  app.post("/create",(req,res)=>{
    const nombre = req.body.nombre;
    const correo = req.body.correo;
    const psw = req.body.psw;
    const tipo = req.body.tipo;
    

    connection.query('INSERT INTO usuario(nombre, correo, psw, tipo, estatus) VALUES(?,?,?,?,?)',[nombre, correo, psw, tipo, 1],
        (err,result) =>{
            if(err){
                console.log(err);
            } else {
                res.send('Usuario registrado con éxito')
            }
        }
    );
  });

  app.get("/usuarios",(req,res)=>{
    connection.query('SELECT * FROM usuario', 
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send(result);
          }
        }
      );
  });

  app.put("/eliminar/:id_usuario",(req,res)=>{
    const id_usuario = req.params.id_usuario;

    connection.query('UPDATE usuario SET estatus = 0 WHERE id_usuario = ?',id_usuario,
        (err,result) =>{
            if(err){
                console.log(err);
            } else {
                res.send('Usuario eliminado con éxito')
            }
        }
    );
  });


  app.put("/update",(req,res)=>{
    const nombre = req.body.nombre;
    const correo = req.body.correo;
    const psw = req.body.psw;
    const tipo = req.body.tipo;
    const id_usuario = req.body.id_usuario;

    connection.query('UPDATE usuario SET nombre = ?, correo = ?, psw = ?, tipo = ? WHERE id_usuario = ?',[nombre, correo, psw, tipo, id_usuario],
        (err,result) =>{
            if(err){
                console.log(err);
            } else {
                res.send('Se actualizó el usuario con éxito')
            }
        }
    );
  });

  app.post("/login", (req, res) => {
    const email = req.body.correo;
    const password = req.body.psw;
  
    connection.query(
      'SELECT * FROM usuario WHERE correo = ? AND psw = ?',[email, password],
      (err, result) => {
        if (err) {
          console.log(err);
        } else if (result.length > 0) {
          res.json({ success: true, user: result[0] });
        } else {
          res.json({ success: false});
        }
      }
    );
  });
  
// GESTIÓN DE PRODUCTOS

app.post("/createpr", upload.single('imagen'), (req, res) => {
  const nombre = req.body.nombre;
  const descripcion = req.body.descripcion;
  const categoria = req.body.categoria;
  const marca = req.body.marca;
  const precio = req.body.precio;

  if (req.file) {
    const imagenRuta = req.file.originalname;
    console.log(imagenRuta);
    connection.query('INSERT INTO producto(nombre, descripcion, categoria, marca, precio, estatus) VALUES(?,?,?,?,?,?)', [nombre, descripcion, categoria, marca, precio, 1], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send('Imagen registrado con éxito');
        console.log("Producto registrado con éxito");
        connection.query('SELECT MAX(id_producto) AS id_producto FROM producto', (err, maxResult) => {
          if (err) {
            console.log(err);
          } else {
            const id_producto = maxResult[0].id_producto.toString();
            console.log("ID del producto obtenido: " + id_producto);

            connection.query('INSERT INTO imagen(id_producto, nombre, ruta) VALUES(?,?,?)', [id_producto, nombre, imagenRuta], (err, imageResult) => {
              if (err) {
                console.log(err);
              } else {
                console.log('Imagen registrada con éxito');
              }
            });
          }
        });
      }
    });
  } else {
    console.log("Error: No se ha subido un archivo");
  }
});

  

app.get("/productos",(req,res)=>{
  connection.query('SELECT p.nombre, p.categoria, p.precio, p.descripcion, p.estatus, p.id_producto, p.marca, i.ruta FROM producto p INNER JOIN imagen i ON p.id_producto = i.id_producto;', 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
            res.send(result);
        }
      }
    );
});


app.put("/eliminarpr/:id_producto",(req,res)=>{
  const id_producto = req.params.id_producto;

  connection.query('UPDATE producto SET estatus = 0 WHERE id_producto = ?',id_producto,
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Producto eliminado con éxito')
          }
      }
  );
});


app.put("/updatepr",(req,res)=>{
  const nombre = req.body.nombre;
  const descripcion = req.body.descripcion;
  const categoria = req.body.categoria;
  const marca = req.body.marca;
  const precio = req.body.precio;
  const id_producto = req.body.id_producto;
  const imagen = req.body.imagen;

  connection.query('UPDATE producto SET nombre = ?, descripcion = ?, categoria = ?, marca = ?, precio = ? WHERE id_producto = ?',[nombre, descripcion, categoria, marca, precio, id_producto],
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Se actualizó el producto con éxito')
          }
      }
  );

  connection.query('UPDATE imagen SET nombre = ?, imagen = ? WHERE id_producto = ?',[nombre, imagen, id_producto],
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Se actualizó el producto con éxito')
          }
      }
  );
});

// GESTION INVENTARIOS

app.post("/createinv",(req,res)=>{
  const id_sucursal = req.body.id_sucursal;
  const id_producto = req.body.id_producto;
  const cantidad = req.body.cantidad;

  connection.query('INSERT INTO inventario(id_sucursal, id_producto, cantidad, estatus) VALUES(?,?,?,?)',[id_sucursal, id_producto, cantidad, 1],
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Inventario registrado con éxito')
          }
      }
  );
});

app.get("/inventarios",(req,res)=>{
  connection.query('SELECT i.id_inventario AS id_inventario, s.nombre AS sucursal, p.nombre AS producto, i.cantidad AS cantidad, i.estatus AS estatus FROM inventario i INNER JOIN sucursal s ON i.id_sucursal = s.id_sucursal INNER JOIN producto p ON i.id_producto = p.id_producto', 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
            res.send(result);
        }
      }
    );
});

app.put("/eliminarinv/:id_inventario",(req,res)=>{
  const id_inventario = req.params.id_inventario;

  connection.query('UPDATE inventario SET estatus = 0 WHERE id_inventario = ?',id_inventario,
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Inventario eliminado con éxito')
          }
      }
  );
});


app.put("/updateinv",(req,res)=>{
    const id_sucursal = req.body.id_sucursal;
    const id_producto = req.body.id_producto;
    const cantidad = req.body.cantidad;
    const id_inventario = req.body.id_inventario;

  connection.query('UPDATE inventario SET id_sucursal = ?, id_producto = ?, cantidad = ? WHERE id_inventario = ?',[id_sucursal, id_producto, cantidad, id_inventario],
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Se actualizó el inventario con éxito')
          }
      }
  );
});

// GESTION DE SUCURSALES

app.post("/createsucur",(req,res)=>{
  const nombre = req.body.nombre;
  const calle = req.body.calle;
  const colonia = req.body.colonia;
  const numero_exterior = req.body.numero_exterior;
  const telefono = req.body.telefono;
  const correo = req.body.correo;
  const lat = req.body.lat;
  const lng = req.body.lng;

  connection.query('INSERT INTO sucursal(nombre, calle, colonia, numero_exterior, telefono, correo, lat, lng, estatus) VALUES(?,?,?,?,?,?,?,?,?)',[nombre, calle, colonia, numero_exterior, telefono, correo, lat, lng, 1],
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Sucursal registrada con éxito')
          }
      }
  );
});

app.get("/sucursales",(req,res)=>{
  connection.query('SELECT * FROM sucursal', 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
            res.send(result);
        }
      }
    );
});

app.put("/eliminarsucur/:id_sucursal",(req,res)=>{
  const id_sucursal = req.params.id_sucursal;

  connection.query('UPDATE sucursal SET estatus = 0 WHERE id_sucursal = ?',id_sucursal,
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Sucursal eliminada con éxito')
          }
      }
  );
});


app.put("/updatesucur",(req,res)=>{
  const nombre = req.body.nombre;
  const calle = req.body.calle;
  const colonia = req.body.colonia;
  const numero_exterior = req.body.numero_exterior;
  const telefono = req.body.telefono;
  const correo = req.body.correo;
  const id_sucursal = req.body.id_sucursal;

  connection.query('UPDATE sucursal SET nombre = ?, calle = ?, colonia = ?, numero_exterior = ?, telefono = ?, correo = ? WHERE id_sucursal = ?',[nombre, calle, colonia, numero_exterior, telefono, correo,id_sucursal],
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Se actualizó el producto con éxito')
          }
      }
  );
});

//CATALOGO
app.use(express.static(path.join(__dirname, "Imagenes")));
app.post("/catalogo",(req,res)=>{

  const id_sucursal = req.body.id_sucursal;

  connection.query('SELECT p.nombre, p.categoria, p.precio, p.descripcion, p.estatus, p.id_producto, p.marca, i.ruta, inv.id_inventario FROM producto p INNER JOIN imagen i ON p.id_producto = i.id_producto INNER JOIN inventario inv ON p.id_producto = inv.id_producto WHERE p.estatus = 1 AND inv.id_sucursal = ? AND inv.cantidad > 0;', [id_sucursal] , 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
            res.send(result);
        }
      }
    );
});
//ITEM


app.post("/item",(req,res)=>{

  const id_inventario = req.body.id_inventario;

  connection.query('SELECT p.nombre, p.categoria, p.precio, p.descripcion, inv.id_inventario, p.marca, i.ruta, inv.cantidad AS inventario FROM producto p INNER JOIN imagen i ON p.id_producto = i.id_producto INNER JOIN inventario inv ON p.id_producto = inv.id_producto WHERE p.estatus = 1 AND inv.id_inventario = ?;', [id_inventario] , 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
            res.send(result);
        }
      }
    );
});

//CARRITO

app.post("/agregarcarrito",(req,res)=>{

  const id_inventario = req.body.id_inventario;
  const id_usuario = req.body.id_usuario;
  const cantidad = req.body.cantidad;
  const subtotal = req.body.subtotal;
 
  connection.query('SELECT * FROM carrito WHERE id_usuario = ? AND id_inventario = ?', [id_usuario, id_inventario], 
    (err,result) =>{
        if(err){
            console.log(err);
        } else if (result.length > 0) {
          res.status(409).send("El producto ya está en el carrito");
        } else {
          connection.query('INSERT INTO carrito (id_usuario, id_inventario, cantidad, subtotal) VALUES (?,?,?,?)', [id_usuario, id_inventario, cantidad, subtotal], 
          (err,result) =>{
              if(err){
                  console.log(err);
              } else {
                res.send(result);
              }
            }
          );
        }
      }
    );
});

app.post("/carrito",(req,res)=>{

  const id_usuario = req.body.id_usuario;

  connection.query('SELECT c.id_carrito, p.nombre AS producto, s.nombre, p.precio, c.subtotal, c.cantidad, i.id_inventario, i.cantidad AS inventario FROM carrito c INNER JOIN inventario i ON c.id_inventario = i.id_inventario INNER JOIN producto p ON i.id_producto = p.id_producto INNER JOIN sucursal s ON s.id_sucursal = i.id_sucursal WHERE c.id_usuario=?;', [id_usuario] , 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
            res.send(result);
        }
      }
    );
});

app.post("/carritodr",(req,res)=>{

  const id_usuario = req.body.id_usuario;

  connection.query('SELECT c.id_carrito, p.nombre AS producto, s.nombre, p.precio, c.subtotal, c.cantidad, i.id_inventario, i.cantidad AS inventario, im.ruta FROM carrito c INNER JOIN inventario i ON c.id_inventario = i.id_inventario INNER JOIN producto p ON i.id_producto = p.id_producto INNER JOIN imagen im ON im.id_producto = p.id_producto INNER JOIN sucursal s ON s.id_sucursal = i.id_sucursal WHERE c.id_usuario=?;', [id_usuario] , 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
            res.send(result);
        }
      }
    );
});

app.post("/totalcarrito",(req,res)=>{

  const id_usuario = req.body.id_usuario;

  connection.query('SELECT  SUM(c.subtotal) AS total FROM carrito c WHERE c.id_usuario=?;', [id_usuario] , 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
            res.send(result);
        }
      }
    );
});

app.put("/updatecarritomas",(req,res)=>{

  const cantidad = req.body.cantidad;
  const id_carrito = req.body.id_carrito;
  const precio = req.body.precio;

  connection.query('UPDATE carrito SET cantidad = ?, subtotal = ? * ? WHERE id_carrito = ?;',[cantidad, cantidad, precio, id_carrito],
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Se actualizó el producto con éxito');
          }
      }
  );
});

app.put("/updatecarritomenos",(req,res)=>{

  const cantidad = req.body.cantidad ;
  const id_carrito = req.body.id_carrito;
  const precio = req.body.precio;

  connection.query('UPDATE carrito SET cantidad = ?, subtotal = ? * ? WHERE id_carrito = ?;',[cantidad, cantidad, precio, id_carrito],
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Se actualizó el producto con éxito');
          }
      }
  );
});

app.put("/deletecarrito",(req,res)=>{

  const id_carrito = req.body.id_carrito;

  connection.query('DELETE FROM carrito WHERE id_carrito = ?;',[id_carrito],
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Se elimino el producto correctamente');
          }
      }
  );
});

//COMPRA

app.post("/direcciones",(req,res)=>{

  const id_usuario = req.body.id_usuario;

  connection.query('SELECT * FROM direccionenvio WHERE id_usuario=? AND estatus = 1;', [id_usuario] , 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
            res.send(result);
        }
      }
    );
});

app.post("/direccion",(req,res)=>{

  const id_usuario = req.body.id_usuario;
  const colonia = req.body.colonia;
  const numero_exterior = req.body.numero_exterior;
  const cp = req.body.cp;
  const calle = req.body.calle;

  connection.query('INSERT INTO direccionenvio (id_usuario, calle, colonia, numero_exterior, cp) VALUES (?,?,?,?,?)', [id_usuario, calle, colonia, numero_exterior, cp], 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
          res.send(result);
        }
      }
    );
});

app.post("/direccionselected",(req,res)=>{

  const id_direccion = req.body.id_direccion;

  connection.query('SELECT * FROM direccionenvio WHERE id_direccion = ?', [id_direccion], 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
          res.send(result);
        }
      }
    );
});

app.put("/eliminardir/:id_direccion",(req,res)=>{
  const id_direccion = req.params.id_direccion;

  connection.query('UPDATE direccionenvio SET estatus = 0 WHERE id_direccion = ?',id_direccion,
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Direccion eliminada con éxito')
          }
      }
  );
});

app.post("/compra", async(req,res)=>{

  console.log(req.body);

  const id_usuario = req.body.id_usuario;
  const total = req.body.subtotal;
  const productosJSONString = req.body.productos;
  const productos = JSON.parse(productosJSONString);
  let sufficientStock = true;

  console.log(productos);

  const ventaResult = await new Promise((resolve, reject) => {
    connection.query('INSERT INTO venta (id_usuario, total, fecha) VALUES (?,?,NOW())', [id_usuario, total], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  for (const producto of productos) {
    const id_inventario = producto.id_inventario;
    const cantidad = producto.cantidad;
    const precio = producto.precio;
    const subtotal = producto.subtotal;

    console.log(id_inventario);
    const cantidadResult = await new Promise((resolve, reject) => {
      connection.query('SELECT cantidad FROM inventario WHERE id_inventario = ?', [id_inventario], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    const cantidadinv = cantidadResult[0].cantidad;

    if (cantidad > cantidadinv) {
      console.log("Stock insuficiente for product with id_inventario: ", id_inventario);
      sufficientStock = false;
    } else {
      const idVentaResult = await new Promise((resolve, reject) => {
        connection.query('SELECT MAX(id_venta) AS venta FROM venta', (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });

      const id_venta = idVentaResult[0].venta;

      await new Promise((resolve, reject) => {
        connection.query('INSERT INTO detalleventa (id_venta, id_inventario, cantidad, precio, subtotal) VALUES (?,?,?,?,?)', [id_venta, id_inventario, cantidad, precio, subtotal], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });

      await new Promise((resolve, reject) => {
        connection.query('DELETE FROM carrito WHERE id_inventario = ?  AND id_usuario = ?', [id_inventario, id_usuario], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });

      await new Promise((resolve, reject) => {
        connection.query('UPDATE inventario SET cantidad = ? - ? WHERE id_inventario = ?', [cantidadinv, cantidad, id_inventario], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    }
  }

  if (sufficientStock) {
    res.send('compra realizada');
  } else {
    res.status(400).send('Stock insuficiente para algunos productos');
  }

});

// LISTA DE DESEOS

app.post("/agregarlista",(req,res)=>{

  const id_inventario = req.body.id_inventario;
  const id_usuario = req.body.id_usuario;
  const cantidad = req.body.cantidad;
  const subtotal = req.body.subtotal;

  connection.query('SELECT * FROM lista WHERE id_usuario = ? AND id_inventario = ?', [id_usuario, id_inventario], 
  (err,result) =>{
      if(err){
          console.log(err);
      } else if (result.length > 0) {
        res.status(409).send("El producto ya está en el carrito");
      } else {
        connection.query('INSERT INTO lista (id_usuario, id_inventario, cantidad, subtotal) VALUES (?,?,?,?)', [id_usuario, id_inventario, cantidad, subtotal], 
        (err,result) =>{
            if(err){
                console.log(err);
            } else {
              res.send(result);
            }
          }
        );
      }
    }
  );
});

app.post("/agregarcarritolista",(req,res)=>{

  const id_inventario = req.body.id_inventario;
  const id_lista = req.body.id_lista;
  const id_usuario = req.body.id_usuario;
  const cantidad = req.body.cantidad;
  const subtotal = req.body.subtotal;

  connection.query('SELECT * FROM carrito WHERE id_usuario = ? AND id_inventario = ?', [id_usuario, id_inventario], 
  (err,result) =>{
      if(err){
          console.log(err);
      } else if (result.length > 0) {
        res.status(409).send("El producto ya está en el carrito");
      } else {
        connection.query('INSERT INTO carrito (id_usuario, id_inventario, cantidad, subtotal) VALUES (?,?,?,?)', [id_usuario, id_inventario, cantidad, subtotal], 
        (err,result) =>{
            if(err){
                console.log(err);
            } else {
              connection.query('DELETE FROM lista WHERE id_lista = ?', [id_lista], 
          (err,result) => {
            if (err) {
              console.log(err);
            } else {
              console.log(id_lista);
              res.send(result);
            }
          });
            }
          }
        );
      }
    }
  );
});

app.post("/lista",(req,res)=>{

  const id_usuario = req.body.id_usuario;

  connection.query('SELECT l.id_lista, p.nombre AS producto, s.nombre, p.precio, l.subtotal, l.cantidad, i.id_inventario, i.cantidad AS inventario FROM lista l INNER JOIN inventario i ON l.id_inventario = i.id_inventario INNER JOIN producto p ON i.id_producto = p.id_producto INNER JOIN sucursal s ON s.id_sucursal = i.id_sucursal WHERE l.id_usuario=?;', [id_usuario] , 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
            res.send(result);
        }
      }
    );
});

app.post("/listadr",(req,res)=>{

  const id_usuario = req.body.id_usuario;

  connection.query('SELECT l.id_lista, p.nombre AS producto, s.nombre, p.precio, l.subtotal, l.cantidad, i.id_inventario, i.cantidad AS inventario, im.ruta FROM lista l INNER JOIN inventario i ON l.id_inventario = i.id_inventario INNER JOIN producto p ON i.id_producto = p.id_producto INNER JOIN imagen im ON im.id_producto = p.id_producto INNER JOIN sucursal s ON s.id_sucursal = i.id_sucursal WHERE l.id_usuario=?;', [id_usuario] , 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
          console.log(id_usuario);
            console.log(result);
            res.send(result);
        }
      }
    );
});

app.put("/updatelistamas",(req,res)=>{

  const cantidad = req.body.cantidad;
  const id_lista = req.body.id_lista;
  const precio = req.body.precio;

  connection.query('UPDATE lista SET cantidad = ?, subtotal = ? * ? WHERE id_lista = ?;',[cantidad, cantidad, precio, id_lista],
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Se actualizó el producto con éxito');
          }
      }
  );
});

app.put("/updatelistamenos",(req,res)=>{

  const cantidad = req.body.cantidad ;
  const id_lista = req.body.id_lista;
  const precio = req.body.precio;

  connection.query('UPDATE lista SET cantidad = ?, subtotal = ? * ? WHERE id_lista = ?;',[cantidad, cantidad, precio, id_lista],
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Se actualizó el producto con éxito');
          }
      }
  );
});

app.put("/deletelista",(req,res)=>{

  const id_lista = req.body.id_lista;
  console.log('Eliminando de lista');

  connection.query('DELETE FROM lista WHERE id_lista = ?;',[id_lista],
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Se elimino el producto correctamente');
          }
      }
  );
});

app.put("/deletelistashop",(req,res)=>{

  const id_inventario = req.body.id_inventario;
  const id_usuario = req.body.id_usuario;
  console.log('Eliminando de la lista');

  connection.query('DELETE FROM lista WHERE id_inventario = ? AND id_usuario = ?;',[id_inventario, id_usuario],
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Se elimino el producto correctamente');
          }
      }
  );
});

//FACTURA

app.post("/factura",(req,res)=>{

  const id_venta = req.body.id_venta;

  connection.query('SELECT p.nombre AS producto, s.nombre, dv.cantidad, dv.precio, dv.subtotal FROM venta v INNER JOIN detalleventa dv ON v.id_venta = dv.id_venta INNER JOIN inventario i ON dv.id_inventario = i.id_inventario INNER JOIN producto p ON i.id_producto = p.id_producto INNER JOIN sucursal s ON i.id_sucursal = s.id_sucursal WHERE v.id_venta = ?;', [id_venta] , 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
            res.send(result);
        }
      }
    );
});

app.post("/historial",(req,res)=>{

  const id_usuario = req.body.id_usuario;

  connection.query('SELECT v.id_venta, GROUP_CONCAT(p.nombre SEPARATOR \', \') AS productos, v.fecha, v.id_factura, v.total FROM venta v INNER JOIN detalleventa d ON v.id_venta = d.id_venta INNER JOIN inventario i ON d.id_inventario = i.id_inventario INNER JOIN producto p ON i.id_producto = p.id_producto WHERE v.id_usuario = ? GROUP BY v.id_venta, v.fecha, v.id_factura ORDER BY v.id_venta DESC;', [id_usuario] , 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
            res.send(result);
        }
      }
    );
});

app.post("/perfiles",(req,res)=>{

  const id_usuario = req.body.id_usuario;

  connection.query('SELECT * FROM perfilfactura WHERE id_usuario=? AND estatus = 1;', [id_usuario] , 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
            res.send(result);
        }
      }
    );
});

app.post("/perfil",(req,res)=>{

  const id_usuario = req.body.id_usuario;
  const nombrePerfil = req.body.nombrePerfil;
  const rfc = req.body.rfc;
  const razonSocial = req.body.razonSocial;
  const regimenFiscal = req.body.regimenFiscal;
  const cp = req.body.cp;

  connection.query('INSERT INTO perfilfactura (id_usuario, nombrePerfil, RFC, razonSocial, regimenFiscal, CP, estatus) VALUES (?,?,?,?,?,?,?)', [id_usuario, nombrePerfil, rfc, razonSocial, regimenFiscal, cp, 1], 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
          res.send(result);
        }
      }
    );
});

app.post("/perfilselected",(req,res)=>{

  const id_perfil = req.body.id_perfil;

  connection.query('SELECT * FROM perfilfactura WHERE id_perfilFactura = ?', [id_perfil], 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
          res.send(result);
        }
      }
    );
});

app.put("/eliminarperfil/:id_perfil",(req,res)=>{
  const id_perfil = req.params.id_perfil;

  connection.query('UPDATE perfilfactura SET estatus = 0 WHERE id_perfilFcatura = ?',id_perfil,
      (err,result) =>{
          if(err){
              console.log(err);
          } else {
              res.send('Direccion eliminada con éxito')
          }
      }
  );
});

app.post("/facturar",(req,res)=>{

  const id_perfilFactura = req.body.id_perfilFactura;
  const id_venta = req.body.id_venta;

  connection.query('INSERT INTO factura (id_perfilFactura, fecha) VALUES (?, NOW())', [id_perfilFactura], 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
          connection.query('SELECT MAX(id_factura) AS factura FROM factura;', 
          (err,result) =>{
              if(err){
                  console.log(err);
              } else {
                const id_factura = result[0].factura;
                console.log(id_factura);
                console.log(id_venta);
                connection.query('UPDATE venta SET id_factura = ? WHERE id_venta = ?;',[id_factura, id_venta], 
                (err,result) =>{
                    if(err){
                        console.log(err);
                    } else {
                      res.send('factura realizada');
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
});

app.get("/detallesfactura/:idVenta",(req,res)=>{

  const id_venta = req.params.idVenta;

  connection.query('SELECT p.nombre AS producto, s.nombre AS sucursal, dv.cantidad, dv.precio, dv.subtotal, v.total, f.fecha AS fecha_factura, v.fecha AS fecha_venta, pf.razonSocial, pf.regimenFiscal, pf.cp FROM venta v INNER JOIN detalleventa dv ON v.id_venta = dv.id_venta INNER JOIN inventario i ON dv.id_inventario = i.id_inventario INNER JOIN factura f ON v.id_factura = f.id_factura INNER JOIN perfilfactura pf ON f.id_perfilFactura = pf.id_perfilFactura INNER JOIN producto p ON i.id_producto = p.id_producto INNER JOIN sucursal s ON i.id_sucursal = s.id_sucursal WHERE v.id_venta = ?;', [id_venta] , 
    (err,result) =>{
        if(err){
            console.log(err);
        } else {
            res.send(result);
        }
      }
    );
});

//MAPA

app.get('/coordenadas', (req, res) => {

  connection.query("SELECT lat, lng FROM sucursal", 
  (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.listen(3001,()=>{
  console.log('server is running on port 3001');
});




