const express = require('express');

function createRolRouter(adminUpdateRolController) {
  const router = express.Router();

  router.put('/', (req, res) => adminUpdateRolController.update(req, res));

  return router;
}

module.exports = createRolRouter;
