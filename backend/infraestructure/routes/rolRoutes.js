const express = require('express');

function createRolRouter(adminUpdateRolController, autenticar, requerirAdmin) {
  const router = express.Router();

  router.use(autenticar);
  router.use(requerirAdmin);

  router.get('/', (req, res) => adminUpdateRolController.listar(req, res));
  router.put('/', (req, res) => adminUpdateRolController.update(req, res));

  return router;
}

module.exports = createRolRouter;
