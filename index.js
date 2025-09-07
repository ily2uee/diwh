export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const body = await request.json();
      let { hwid, userId } = body;

      if (!hwid || !userId) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing hwid or userId" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Убираем пробелы вокруг и внутри hwid
      hwid = String(hwid).trim();

      // Приводим userId к строке
      const userIdStr = String(userId).trim();

      const storedValue = await env.USERS.get(hwid);

      if (!storedValue) {
        // HWID не найден
        return new Response(
          JSON.stringify({ success: false, error: "HWID not found" }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (storedValue === "pending") {
        // Первый раз — привязываем HWID к userId
        await env.USERS.put(hwid, userIdStr);
        console.log(`HWID ${hwid} привязан к UserID ${userIdStr}`);
        return new Response(
          JSON.stringify({
            success: true,
            message: "HWID linked",
            userId: userIdStr,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (storedValue === userIdStr) {
        // Совпадает → доступ разрешён
        console.log(`HWID ${hwid} успешно вошёл для UserID ${userIdStr}`);
        return new Response(
          JSON.stringify({ success: true, userId: userIdStr }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Если чужой userId пытается использовать HWID
      console.warn(
        `ОШИБКА: HWID ${hwid} уже привязан к UserID ${storedValue}, а пытался войти ${userIdStr}`
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "HWID already linked to another user",
          realUserId: storedValue,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};
