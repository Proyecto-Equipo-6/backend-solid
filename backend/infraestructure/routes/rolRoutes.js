const express = require('express');

function createRolRouter(adminUpdateRolController, autenticar, requerirAdmin) {
  const router = express.Router();

  router.use(autenticar);
  router.use(requerirAdmin);

  router.get('/', (req, res) => adminUpdateRolController.listar(req, res));
  router.post('/', (req, res) => adminUpdateRolController.crear(req, res));
  router.put('/', (req, res) => adminUpdateRolController.update(req, res));
  router.delete('/:id', (req, res) => adminUpdateRolController.eliminar(req, res));

  return router;
}

module.exports = createRolRouter;
