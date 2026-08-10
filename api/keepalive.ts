// =============================================
// 昌都记忆 — Supabase 保活函数
// =============================================
// 作用：Vercel Cron 每天触发本函数一次，向 Supabase 发起一次真实数据库查询，
//       使免费项目不因「连续 7 天无活动」被自动暂停。
//
// 密钥说明：
//   SUPABASE_URL                 = Supabase 项目 URL
//   SUPABASE_SERVICE_ROLE_KEY    = service_role 密钥（仅服务端使用，绕开 RLS）
//   这两个变量没有 VITE_ 前缀，不会被打进前端 bundle，可安全放在 Vercel 环境变量。
//
// 手动验证：浏览器直接访问  https://<你的域名>/api/keepalive 看返回内容。

export default async function handler(): Promise<Response> {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return new Response(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. 请在 Vercel 环境变量中配置后再部署。',
      { status: 500 },
    )
  }

  try {
    // 一次真实的 PostgREST 查询：对 profiles 表取 id（limit 1）。
    // service_role 绕过 RLS，即使表为空也返回 2xx，请求本身即计入项目活动。
    const res = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return new Response(`keepalive failed: HTTP ${res.status} ${body}`, { status: 502 })
    }

    return new Response(`keepalive ok at ${new Date().toISOString()}`, { status: 200 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(`keepalive error: ${msg}`, { status: 502 })
  }
}
