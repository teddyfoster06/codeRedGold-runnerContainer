const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const serverIP = 'host.docker.internal'

const { exec, spawn } = require('node:child_process');

let occupied = false;

app.get('/is-occupied', (req, res) => {
    res.send(occupied + "")
})

wss.on('connection', (ws) => {

    console.log('A client attempted to connect');
    if (occupied) {
        console.log("Denied join request (Container full)")
        ws.close(1001, 'Container Occupied')
    } else {
        console.log("Accepted join request")
        ws.send('Join Success');
        occupied = true;
    }

    ws.on('message', (msg) => {
        console.log("Recieved code from client")

        msg = msg.toString();
        let hyphenIndex = -1;
        for (let i = 0; i < msg.length; i++) {
            if (msg[i] === "-") {
                hyphenIndex = i;
                break;
            }
        }

        const type = msg.substring(0, hyphenIndex);
        const code = msg.substring(hyphenIndex + 1);
        console.log("Language: " + type);
        console.log("Code: " + code);

        if (type === 'java') {
            fs.writeFile('Main.java', code, (err) => {
                if (err) {
                    console.log("File Write Failed");
                    console.log("Error:");
                    console.log(err);
                    ws.close(3420, "File Write Failed");
                    return;
                }

                exec(`cat Main.java`, (err, stdout, stderr) => {
                    if (err) {
                        console.log("Failed to echo file: " + err);
                        ws.close(3420, "Failed to echo file");
                    } else if (stderr) {
                        console.log("Failed to echo file: " + stderr);
                        ws.close(3420, "Failed to echo file");
                    } else if (stdout) {
                        exec('javac Main.java', (err, stdout, stderr) => {
                            if (err) {
                                console.log("Compilation Error:");
                                console.log(err);
                                ws.send(err.message);
                                ws.close(3420, "Compilation Error");
                            } else if (stderr) {
                                console.log("Compilation Error:");
                                console.log(stderr);
                                ws.send(stderr.message);
                                ws.close(3420, "Compilation Error");
                            } else {
                                const dockerProcess = spawn('java', ['Main']);

                                const timeout = setTimeout(() => {
                                    dockerProcess.kill('SIGKILL');
                                    ws.send("Process timed out after 10 seconds.");
                                    ws.close(3420, "Execution Timeout");
                                }, 10000);

                                dockerProcess.stdout.on('data', (data) => {
                                    console.log(data.toString());
                                    ws.send(data);
                                });
                                dockerProcess.stderr.on('data', (data) => {
                                    console.log(data.toString());
                                    ws.send(data);
                                });
                                dockerProcess.on('close', (code) => {
                                    clearTimeout(timeout);
                                    setTimeout(() => {
                                        ws.close(3420, `Exited with code ${code}`);
                                    }, 500);
                                });
                            }
                            return;
                        });
                    }
                    return;
                });
            });

        } else if (type === 'python') {

            fs.writeFile('PyRunner.py', code, (err) => {
                if (err) {
                    console.log("File Write Failed");
                    console.log("Error:");
                    console.log(err);
                    ws.close(3420, "File Write Failed");
                    return;
                }

                exec(`cat PyRunner.py`, (err, stdout, stderr) => {
                    if (err) {
                        console.log("Compilation Error:");
                        console.log(err);
                        ws.send(err.message);
                        ws.close(3420, "Compilation Error");
                    } else if (stderr) {
                        console.log("Compilation Error:");
                        console.log(stderr);
                        ws.send(stderr.message);
                        ws.close(3420, "Compilation Error");
                    } else {
                        const dockerProcess = spawn('python3', ['./PyRunner.py']);

                        const timeout = setTimeout(() => {
                            dockerProcess.kill('SIGKILL');
                            ws.send("Process timed out after 10 seconds.");
                            ws.close(3420, "Execution Timeout");
                        }, 10000);

                        dockerProcess.stdout.on('data', (data) => {
                            console.log(data.toString());
                            ws.send(data);
                        });
                        dockerProcess.stderr.on('data', (data) => {
                            console.log(data.toString());
                            ws.send(data);
                        });
                        dockerProcess.on('close', (code) => {
                            clearTimeout(timeout);
                            ws.close(3420, `Exited with code ${code}`);
                        });

                        return;

                    }
                    return;
                });
            });

        }

    });

    ws.on('close', () => {
        occupied = false;
        console.log('Client disconnected');
    });

});

server.listen(3080, '0.0.0.0', () => {
    console.log('Server is listening on port 3080');
    attempt();
});

async function attempt() {
    console.log("Attempting at " + 'http://' + serverIP + ':3000/register-runner' + "...");
    try {
        await fetch('http://' + serverIP + ':3000/register-runner')
            .then(res => {
                return;
            })
            .catch(error => {
                setTimeout(attempt, 10000)
            })

    } catch (error) {
        setTimeout(attempt, 10000)
    }
}
