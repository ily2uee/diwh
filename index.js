export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const body = await request.json();
      const { hwid, userId } = body;

      if (!hwid || !userId) {
        return new Response(JSON.stringify({ success: false, error: "Missing hwid or userId" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Проверяем, есть ли такой hwid в KV
      const storedValue = await env.USERS.get(hwid);

      if (!storedValue) {
        // HWID не найден → отказ
        return new Response(JSON.stringify({ success: false, error: "HWID not found" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Если в KV только заглушка (например "pending"),
      // то записываем туда userId (привязываем игрока)
      if (storedValue === "pending") {
        await env.USERS.put(hwid, userId);
        return new Response(JSON.stringify({ success: true, message: "HWID linked", userId }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Если уже привязан userId → просто возвращаем его
      return new Response(JSON.stringify({ success: true, userId: storedValue }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
