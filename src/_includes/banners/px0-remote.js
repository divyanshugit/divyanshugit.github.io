// "Adding Remote Mode to px0" — the whole mechanism on one sheet.
// Laptop: the browser opens 127.0.0.1:7777. One ssh command forwards that
// port (-L 127.0.0.1:7777:127.0.0.1:41234) to the VM, where px0 is bound to
// its loopback only, so nothing is reachable from the VM's network. Below,
// the lifeline: the ssh session's stdin, duplicated to fd 3; when it closes,
// cat returns and the watcher kills px0. Ports are the ones in the post.
module.exports = {
  slug: "px0-remote",
  title: "px0 remote mode: a browser, an ssh tunnel, a VM",
  desc: "On the laptop, the browser opens 127.0.0.1 port 7777. A single ssh connection forwards that port to 127.0.0.1 port 41234 on the VM, where px0 listens on loopback only, so no port is open on the VM's network. Beneath the tunnel runs the session's stdin; when it closes, a watcher on the VM kills px0.",
  caption: "One ssh command does both jobs: it carries 127.0.0.1:7777 on the laptop to px0 on the VM’s loopback, and its stdin is px0’s lifeline — when the session ends, the watcher kills px0.",
  draw(k) {
    const { t, p, ln, rect, circ, arrow, head } = k;
    let s = "";
    const LX = 40, LW = 300, VX = 760, VW = 300, BY = 96, BH = 250;

    // machines
    s += rect(LX, BY, LW, BH, "h");
    s += rect(VX, BY, VW, BH, "h");
    s += t(LX, BY - 18, "laptop", "l");
    s += t(VX, BY - 18, "vm", "l");
    s += t(VX + VW, BY - 18, "ubuntu@vm", "c x", "end");
    // the VM's network edge: nothing listening outside loopback
    s += rect(VX + 14, BY + 14, VW - 28, BH - 28, "hf d");
    s += t(VX + 28, BY + BH - 26, "no open port", "n x");

    // laptop: browser → local end
    s += rect(LX + 24, BY + 40, 150, 86, "fp h", 2);
    s += ln(LX + 24, BY + 58, LX + 174, BY + 58, "hf");
    [0, 1, 2].forEach((i) => s += circ(LX + 34 + i * 9, BY + 49, 2.2, "ffr"));
    s += ln(LX + 38, BY + 82, LX + 150, BY + 82, "hf") + ln(LX + 38, BY + 98, LX + 124, BY + 98, "hf") + ln(LX + 38, BY + 112, LX + 138, BY + 112, "hf");
    s += t(LX + 24, BY + 158, "browser", "l x");
    s += t(LX + 24, BY + 214, "$ px0 vm:~/work/repo", "c x");
    const portY = BY + 83;
    s += circ(LX + LW, portY, 5, "fp ik");
    s += t(LX + LW - 14, portY - 16, ":7777", "c", "end");
    s += ln(LX + 174, portY, LX + LW - 5, portY, "s3");

    // VM: px0 on loopback
    s += rect(VX + 150, BY + 40, 120, 86, "fp h", 2);
    s += t(VX + 210, BY + 90, "px0", "m", "middle");
    s += circ(VX, portY, 5, "fp ik");
    s += t(VX + 14, portY - 16, ":41234", "c");
    s += ln(VX + 5, portY, VX + 150, portY, "s3");
    s += t(VX + 150, BY + 158, "127.0.0.1 only", "n x");

    // the tunnel: two walls, the ink path inside
    const x0 = LX + LW + 5, x1 = VX - 5;
    s += ln(x0, portY - 13, x1, portY - 13, "h") + ln(x0, portY + 13, x1, portY + 13, "h");
    s += `<g class="reveal">` + ln(x0, portY, x1, portY, "ik") + `</g>`;
    s += t((x0 + x1) / 2, portY - 30, "ssh -L", "ci", "middle");
    s += t((x0 + x1) / 2, portY + 42, "one connection", "l x", "middle");

    // the lifeline: stdin → fd 3 → cat → kill
    const LY = 420;
    s += ln(LX + LW / 2, BY + BH, LX + LW / 2, LY, "s3 d");
    s += ln(LX + LW / 2, LY, VX + 264, LY, "s3 d");
    s += p(`M${VX + 264},${LY} L${VX + 264},${BY + 126 + 4}`, "s3 dt");
    s += head(VX + 264, BY + 126 + 4, -Math.PI / 2, "s3", 8);
    s += t(VX + VW, LY + 36, "cat <&3 ; kill px0", "c", "end");
    s += t(LX + LW / 2 + 14, LY - 14, "stdin, held open", "l");
    s += t((LX + LW / 2 + VX) / 2 + 60, LY - 14, "exec 3<&0", "c x", "middle");
    return s;
  }
};
