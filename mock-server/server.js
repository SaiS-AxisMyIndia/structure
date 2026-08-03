const http = require('http');

const PORT = 4000;

const userJobs = [
  { id: '1', title: 'Site Survey - Downtown', status: 'In Progress' },
  { id: '2', title: 'Roof Inspection', status: 'Completed' },
  { id: '3', title: 'Land Assessment', status: 'Pending' },
];

const surveyorAssignments = [
  { id: '1', siteName: 'Warehouse A', status: 'Scheduled' },
  { id: '2', siteName: 'Plot 42', status: 'In Progress' },
];

const routes = {
  'GET /user/home': () => ({ greeting: 'Welcome back!', activeJobsCount: userJobs.length }),
  'GET /user/jobs': () => userJobs,
  'GET /surveyor/home': () => ({
    greeting: 'Welcome, Surveyor',
    pendingAssignmentsCount: surveyorAssignments.length,
  }),
  'GET /surveyor/assignments': () => surveyorAssignments,
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  res.setHeader('Content-Type', 'application/json');

  const jobDetailMatch = url.pathname.match(/^\/user\/jobs\/(.+)$/);
  if (req.method === 'GET' && jobDetailMatch) {
    const job = userJobs.find(j => j.id === jobDetailMatch[1]);
    if (job) {
      res.writeHead(200);
      res.end(JSON.stringify(job));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ message: 'Job not found' }));
    }
    return;
  }

  const handler = routes[`${req.method} ${url.pathname}`];
  if (handler) {
    res.writeHead(200);
    res.end(JSON.stringify(handler()));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ message: `No mock for ${req.method} ${url.pathname}` }));
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Mock API server already running on http://localhost:${PORT}`);
    process.exit(0);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`Mock API server listening on http://localhost:${PORT}`);
});
