module.exports = {
  files: [
    {
      loader: {
        type: "backend-api"
      },
      path: "middleware/api.js",
    },
    {
      loader: {
        type: "backend-middleware-collection"
      },
      path: "middleware/collection.js",
    },
    {
      loader: {
        type: "backend-middleware-interface"
      },
      path: "middleware/interface.js",
    },
    {
      loader: {
        type: "backend-middleware-socket"
      },
      path: "middleware/socket.js",
    },
    {
      loader: {
        type: "backend-middleware-static"
      },
      path: "middleware/static.js",
    }
  ]
};
