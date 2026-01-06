window.electronAPI.onStatusUpdate(data => {
    document.getElementById('activeTime').innerText = formatTime(data.activeTime);
    document.getElementById('status').innerText = data.paused
      ? 'Paused'
      : data.isIdle
      ? 'Idle'
      : 'Active';
    document.getElementById('idleTime').innerText = `${data.idleSeconds} sec`;
    document.getElementById('totalidleTime').innerText = `${data.totalIdleTime} sec`;

  });
  
  document.getElementById('pauseBtn').addEventListener('click', () => {
    window.electronAPI.togglePause();
  });
  
  function formatTime(seconds) {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  }


  window.electronAPI.onScreenshot((filePath) => {
    const overlay = document.createElement('div');
    overlay.innerText = '📸 Screenshot saved!';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '20px', right: '20px',
      background: 'rgba(0,0,0,0.7)',
      color: '#fff',
      padding: '10px 20px',
      borderRadius: '8px',
      opacity: '0',
      transition: 'opacity 0.5s'
    });
    document.body.appendChild(overlay);
  
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.addEventListener('transitionend', () => overlay.remove());
      }, 2000);
    });
  });
  
  
