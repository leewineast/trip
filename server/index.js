import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const LOG_DIR = path.join(__dirname, 'logs')
const LOG_FILE = path.join(LOG_DIR, 'access.log')
fs.mkdirSync(LOG_DIR, { recursive: true })

const app = express()
app.use(express.json())
// 信任代理链,使 req.ip / X-Forwarded-For 反映访客真实 IP
app.set('trust proxy', true)

const memLogs = []
const MAX_MEM = 500

function appendLog(entry) {
  const line = JSON.stringify(entry)
  fs.appendFile(LOG_FILE, line + '\n', () => {})
  memLogs.push(entry)
  if (memLogs.length > MAX_MEM) memLogs.shift()
}

// 尽力提取访客真实 IP(适配 nginx / Vite 开发代理 / 直连)
function getClientIp(req) {
  const xff = req.headers['x-forwarded-for']
  if (xff) {
    const first = String(xff).split(',')[0].trim()
    if (first) return first.replace(/^::ffff:/, '')
  }
  const xreal = req.headers['x-real-ip']
  if (xreal) return String(xreal).trim().replace(/^::ffff:/, '')
  const raw = req.ip || req.socket?.remoteAddress || ''
  return String(raw).replace(/^::ffff:/, '')
}

function isLocalIp(ip) {
  return !ip || ip === '::1' || ip === '127.0.0.1' || ip === '::' || ip === '0.0.0.0'
}

// IP -> 国家/城市/坐标(ip-api.com,免费,仅 http,每分钟 45 次)
async function ipGeo(ip) {
  if (isLocalIp(ip)) {
    return {
      ip,
      local: true,
      note: '本地回环/内网地址,无公网地理位置',
      country: '未知',
      city: '未知',
      region: '未知',
      lat: null,
      lng: null,
    }
  }
  const fields = 'status,message,country,countryCode,regionName,city,lat,lon,query'
  const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=${fields}&lang=zh-CN`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const d = await res.json()
    if (d.status !== 'success') return { ip, error: d.message || 'IP 解析失败' }
    return {
      ip,
      country: d.country,
      countryCode: d.countryCode,
      region: d.regionName,
      city: d.city,
      lat: d.lat,
      lng: d.lon,
    }
  } catch (e) {
    return { ip, error: `IP 解析失败: ${e.message}` }
  }
}

// 经纬度 -> 地址(BigDataCloud,免费,无需 key)
async function reverseGeocode(lat, lng) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=zh`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const d = await res.json()
    const full = [d.locality, d.city, d.principalSubdivision, d.countryName].filter(Boolean).join(' · ')
    return {
      locality: d.locality || null,
      city: d.city || null,
      principalSubdivision: d.principalSubdivision || null,
      countryName: d.countryName || null,
      countryCode: d.countryCode || null,
      full: full || null,
    }
  } catch (e) {
    return { error: `反向地理编码失败: ${e.message}` }
  }
}

// ---- 访问日志(前端进页面时调用)----
app.get('/api/ping', async (req, res) => {
  const ip = getClientIp(req)
  const geo = await ipGeo(ip)
  const entry = {
    时间: new Date().toISOString(),
    事件: '访问',
    路径: req.path,
    方法: req.method,
    IP: ip,
    地理归属: geo,
    来源页: req.headers.referer || null,
    浏览器: req.headers['user-agent'] || null,
  }
  appendLog(entry)
  console.log(`[访问] ${entry.时间} IP=${ip} 国家=${geo.country} 城市=${geo.city}`)
  res.json({ ok: true, ip, geo })
})

// ---- 定位授权:把坐标与 IP 关联并记录 ----
app.post('/api/location', async (req, res) => {
  const ip = getClientIp(req)
  const { latitude, longitude, accuracy } = req.body || {}
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: '必须提供数字类型的 latitude 和 longitude' })
  }
  const [geo, address] = await Promise.all([ipGeo(ip), reverseGeocode(latitude, longitude)])
  const entry = {
    时间: new Date().toISOString(),
    事件: '定位授权',
    IP: ip,
    IP归属: geo,
    浏览器坐标: { 纬度: latitude, 经度: longitude, 精度: accuracy ?? null },
    反向地理编码: address,
    浏览器: req.headers['user-agent'] || null,
  }
  appendLog(entry)
  console.log(
    `[定位授权] ${entry.时间} IP=${ip} 国家=${geo.country} 坐标=(${latitude.toFixed(4)}, ${longitude.toFixed(4)}) 地址=${address.full || '无'}`
  )
  res.json({ ok: true, ip, ipGeo: geo, reverseGeocode: address, coords: { latitude, longitude, accuracy } })
})

// ---- 日志查看 ----
app.get('/api/logs', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, MAX_MEM)
  res.json({
    条数: memLogs.length,
    日志文件: LOG_FILE,
    日志: memLogs.slice(-limit).reverse(),
  })
})

app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`[服务] 后端已启动,监听 http://localhost:${PORT}`)
  console.log(`[服务] 日志文件 -> ${LOG_FILE}`)
})
