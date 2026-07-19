const router = require("express").Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/users
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    res.json(data.users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users
router.post("/", async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { role },
      email_confirm: true,
    });
    if (error) throw error;
    res.status(201).json(data.user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) throw error;
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
