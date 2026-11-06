// Read-only contract check against the running NestJS Swagger document.
// Does not create accounts, change data or call mutation endpoints.
const url = process.argv[2] || 'http://localhost:3000/api-docs-json';
const required = [
  ['POST', '/api/auth/login'], ['POST', '/api/auth/register'], ['POST', '/api/auth/refresh'], ['POST', '/api/auth/logout'],
  ['GET', '/api/users'], ['GET', '/api/users/me'], ['PATCH', '/api/users/{id}'], ['PATCH', '/api/users/lock/{id}'], ['PATCH', '/api/users/unlock/{id}'], ['DELETE', '/api/users/{id}'],
  ['GET', '/api/companies'], ['GET', '/api/companies/{id}'], ['GET', '/api/companies/owner/{ownerId}'], ['POST', '/api/companies'], ['PATCH', '/api/companies/{id}'], ['DELETE', '/api/companies/{id}'],
  ['GET', '/api/jobs'], ['GET', '/api/jobs/{id}'], ['POST', '/api/jobs'], ['PATCH', '/api/jobs/{id}'], ['DELETE', '/api/jobs/{id}'], ['PATCH', '/api/jobs/{id}/block'], ['GET', '/api/skills'],
  ['GET', '/api/resumes'], ['POST', '/api/resumes'], ['GET', '/api/resumes/{id}/file'], ['PATCH', '/api/resumes/{id}'], ['DELETE', '/api/resumes/{id}'],
  ['GET', '/api/applications'], ['POST', '/api/applications'], ['GET', '/api/applications/{id}'], ['GET', '/api/applications/{id}/history'], ['PATCH', '/api/applications/{id}/status'], ['DELETE', '/api/applications/{id}'],
  ['GET', '/api/ai/health'], ['GET', '/api/ai/search'], ['GET', '/api/ai/resumes/{id}/parsed'], ['POST', '/api/ai/resumes/{id}/process'], ['GET', '/api/ai/resumes/{id}/matches'], ['GET', '/api/ai/jobs/{id}/applicants'], ['POST', '/api/ai/applications/{id}/score'],
];
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Swagger HTTP ${response.status}`);
  const doc = await response.json();
  const normalize = path => path.replace(/\{[^}]+\}/g, '{id}');
  const available = new Set(Object.entries(doc.paths || {}).flatMap(([path, operations]) => Object.keys(operations).map(method => `${method.toUpperCase()} ${normalize(path)}`)));
  const missing = required.filter(([method, path]) => !available.has(`${method} ${normalize(path)}`)).map(([method, path]) => `${method} ${path}`);
  console.log(JSON.stringify({ swagger: url, checked: required.length, available: required.length - missing.length, missing, note: 'Route presence only; permissions, response shape and business rules require separate verification.' }, null, 2));
  if (missing.length) process.exitCode = 1;
} catch (error) { console.error(error.message); process.exitCode = 1; }
