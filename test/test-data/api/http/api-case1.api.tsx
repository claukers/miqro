export default {
  method: "POST",
  handler: async function(req, res) {
    return res?.json({
      message: "OK"
    });
  }
}
