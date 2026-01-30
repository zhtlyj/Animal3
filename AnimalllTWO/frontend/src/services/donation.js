// 模拟捐赠与项目服务（可替换为后端/链上接口）

export async function donate({ amount, method, projectId, from }) {
  await wait(500);
  return {
    txHash: '0x' + Math.random().toString(16).slice(2).padEnd(64, '0'),
    projectId: projectId || null,
    amount,
    method,
    from,
    at: new Date().toISOString()
  };
}

export async function fetchDonationHistory(address) {
  await wait(300);
  const raw = JSON.parse(localStorage.getItem('donationHistory') || '[]');
  return raw.filter((r) => !address || r.from === address);
}

export async function createProject({ title, goal, description }) {
  await wait(400);
  const proj = {
    id: 'proj-' + Math.floor(Math.random() * 1e6),
    title, goal: Number(goal), description,
    raised: 0,
    createdAt: new Date().toISOString()
  };
  const list = JSON.parse(localStorage.getItem('projects') || '[]');
  list.unshift(proj);
  localStorage.setItem('projects', JSON.stringify(list));
  return proj;
}

export async function listProjects() {
  await wait(200);
  return JSON.parse(localStorage.getItem('projects') || '[]');
}

export function persistDonation(record) {
  const list = JSON.parse(localStorage.getItem('donationHistory') || '[]');
  list.unshift(record);
  localStorage.setItem('donationHistory', JSON.stringify(list));
  if (record.projectId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const idx = projects.findIndex(p => p.id === record.projectId);
    if (idx >= 0) {
      projects[idx].raised = Number(projects[idx].raised || 0) + Number(record.amount);
      localStorage.setItem('projects', JSON.stringify(projects));
    }
  }
}

function wait(ms){return new Promise(r=>setTimeout(r,ms));}



