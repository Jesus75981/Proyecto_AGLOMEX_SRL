fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "dueno", password: "admin123" })
})
.then(res => res.json().then(data => ({ status: res.status, data })))
.then(result => console.log(JSON.stringify(result, null, 2)))
.catch(err => console.error("Error connecting to backend:", err.message));
