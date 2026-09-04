(() => {
  const form = document.querySelector('#terminal-form');
  const input = document.querySelector('#terminal-input');
  const output = document.querySelector('#terminal-output');
  const profileUrl = 'https://github.com/Creativecole';

  const escapeHtml = (value) => value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);

  const commands = {
    help: [
      'Available commands:',
      '  bio      about Creativecole',
      '  github   open the GitHub profile',
      '  posts    browse published posts',
      '  ls       list this page',
      '  tree     show the site tree',
      '  date     print the current date',
      '  clear    clear the terminal'
    ].join('\n'),
    bio: `Creativecole\nProfile: <a href="${profileUrl}" target="_blank" rel="noreferrer">github.com/Creativecole</a>`,
    github: `Opening <a href="${profileUrl}" target="_blank" rel="noreferrer">github.com/Creativecole</a> …`,
    posts: 'Published writing:\n  <a href="/archives/">archives/</a>\n  <a href="/categories/">categories/</a>\n  <a href="/tags/">tags/</a>',
    ls: '<span class="accent">github/</span>\nposts/\nbio\nhelp\nindex',
    tree: '.\n├── github/\n│   └── Creativecole\n├── posts/\n│   ├── archives/\n│   ├── categories/\n│   └── tags/\n├── bio\n└── help',
    date: () => new Intl.DateTimeFormat('en', { dateStyle: 'full', timeStyle: 'long' }).format(new Date())
  };

  const addLine = (html, className = '') => {
    const line = document.createElement('p');
    line.className = `terminal-line ${className}`.trim();
    line.innerHTML = html;
    output.appendChild(line);
  };

  const run = (rawCommand) => {
    const command = rawCommand.trim().toLowerCase();
    if (!command) return;

    addLine(`<span class="prompt"><span>cc:/</span><b>$</b></span> ${escapeHtml(rawCommand)}`, 'command');

    if (command === 'clear') {
      output.replaceChildren();
      return;
    }

    const result = commands[command];
    if (!result) {
      addLine(`command not found: ${escapeHtml(command)}. Type “help”.`, 'error');
      return;
    }

    addLine(typeof result === 'function' ? result() : result);
    if (command === 'github') {
      window.open(profileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    run(input.value);
    input.value = '';
    input.focus();
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  document.querySelectorAll('[data-command]').forEach((control) => {
    control.addEventListener('click', () => {
      run(control.dataset.command);
      input.focus();
    });
  });

  document.querySelector('#year').textContent = new Date().getFullYear();
  document.addEventListener('click', (event) => {
    if (!event.target.closest('a, button, input')) input.focus();
  });
})();
