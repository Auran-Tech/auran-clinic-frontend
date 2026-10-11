import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawnSync } from 'node:child_process'

const servers = []
async function serve(handler) {
  const server = createServer(handler)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  servers.push(server)
  return `http://127.0.0.1:${server.address().port}`
}
after(async () => {
  await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve))))
})

let web, api, redirectApi
before(async () => {
  web = await serve((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end('<html>Clinic</html>')
  })
  api = await serve((req, res) => {
    res.writeHead(req.url === '/health/live' || req.url === '/health/ready' ? 200 : 404)
    res.end()
  })
  redirectApi = await serve((req, res) => {
    res.writeHead(302, { Location: '/login' })
    res.end()
  })
})

function smoke(frontend, backend) {
  return spawnSync(process.execPath, ['scripts/smoke-deployment.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 20000,
    env: { ...process.env, AURAN_FRONTEND_URL: frontend, AURAN_API_URL: backend },
  })
}

test('passes when frontend and both API health endpoints are available', () => {
  const result = smoke(web, api)
  assert.equal(result.status, 0, result.stderr)
})

test('fails when health endpoints redirect to login', () => {
  const result = smoke(web, redirectApi)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /FAIL Backend liveness/)
})

test('rejects unexpected paths in deployment base URLs', () => {
  const result = smoke(web + '/api', api)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Deployment base URL must be an origin/)
})
