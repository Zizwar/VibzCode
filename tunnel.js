import localtunnel from 'localtunnel';
import fs from 'fs';

(async () => {
  try {
    const tunnel = await localtunnel({ port: 8080 });

    const output = `
🌐 ================================
✅ Tunnel is ready!
🔗 Public URL: ${tunnel.url}
🌐 ================================

Press Ctrl+C to close the tunnel
`;

    console.log(output);
    fs.writeFileSync('/tmp/tunnel-url.txt', tunnel.url);

    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });
  } catch (err) {
    console.error('Error creating tunnel:', err);
    process.exit(1);
  }
})();
