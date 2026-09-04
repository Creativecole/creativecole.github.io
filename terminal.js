(() => {
  const form = document.querySelector('#terminal-form');
  const input = document.querySelector('#terminal-input');
  const output = document.querySelector('#terminal-output');
  const prompt = form.querySelector('.prompt span');
  const profileUrl = 'https://github.com/Creativecole';

  const directories = {
    '/': ['github/', 'posts/', 'bio', 'help', 'index'],
    '/github': ['profile'],
    '/posts': ['archives/', 'categories/', 'tags/'],
    '/posts/archives': ['index'],
    '/posts/categories': ['index'],
    '/posts/tags': ['index']
  };

  const files = {
    '/bio': {
      label: 'Creativecole — GitHub profile',
      href: profileUrl
    },
    '/help': {
      text: 'Type “help” to list available commands.'
    },
    '/index': {
      text: 'Creativecole — a tiny personal corner of the web.'
    },
    '/github/profile': {
      label: 'github.com/Creativecole',
      href: profileUrl
    },
    '/posts/archives/index': {
      label: 'Published archives',
      href: '/archives/'
    },
    '/posts/categories/index': {
      label: 'Post categories',
      href: '/categories/'
    },
    '/posts/tags/index': {
      label: 'Post tags',
      href: '/tags/'
    }
  };

  const commandNames = ['help', 'bio', 'github', 'posts', 'ls', 'cd', 'pwd', 'cat', 'open', 'tree', 'date', 'clear'];
  const history = [];
  let historyIndex = 0;
  let cwd = '/';

  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);

  const resolvePath = (value = '.') => {
    const parts = value.startsWith('/') ? [] : cwd.split('/').filter(Boolean);
    value.split('/').forEach((part) => {
      if (!part || part === '.') return;
      if (part === '..') parts.pop();
      else if (part === '~') parts.splice(0);
      else parts.push(part);
    });
    return `/${parts.join('/')}` || '/';
  };

  const parentPath = (value) => {
    const parts = value.split('/').filter(Boolean);
    parts.pop();
    return `/${parts.join('/')}` || '/';
  };

  const basename = (value) => value.split('/').filter(Boolean).pop() || '/';

  const pathEntries = (path) => directories[path] || [];

  const entryHtml = (entry) => entry.endsWith('/')
    ? `<span class="directory">${escapeHtml(entry)}</span>`
    : escapeHtml(entry);

  const renderList = (path) => pathEntries(path).map(entryHtml).join('\n');

  const renderFile = (file) => {
    if (file.href) {
      return `<a href="${escapeHtml(file.href)}" target="_blank" rel="noreferrer">${escapeHtml(file.label)}</a>`;
    }
    return escapeHtml(file.text);
  };

  const promptHtml = (path = cwd) => `<span class="prompt"><span>cc:${escapeHtml(path)}</span><b>$</b></span>`;

  const updatePrompt = () => {
    prompt.textContent = `cc:${cwd}`;
    form.style.setProperty('--prompt-ch', `cc:${cwd}$`.length);
  };

  const addLine = (html, className = '') => {
    const line = document.createElement('p');
    line.className = `terminal-line ${className}`.trim();
    line.innerHTML = html;
    output.appendChild(line);
  };

  const printError = (message) => addLine(escapeHtml(message), 'error');

  const openTarget = (target) => {
    const path = resolvePath(target);
    const file = files[path];
    if (!file?.href) {
      printError(`open: ${target || ''}: no link found`);
      return;
    }
    addLine(`Opening ${renderFile(file)} …`);
    window.open(file.href, '_blank', 'noopener,noreferrer');
  };

  const handlers = {
    help: () => addLine([
      'Available commands:',
      '  ls [dir]      list directory contents',
      '  cd <dir>      change directory',
      '  pwd           print working directory',
      '  cat <file>    read a virtual file',
      '  open <file>   open the file link',
      '  bio           show the GitHub profile',
      '  github        open the GitHub profile',
      '  posts         browse published posts',
      '  tree          show the site tree',
      '  date          print the current date',
      '  clear         clear the terminal',
      '',
      'Press Tab to complete commands and paths; ↑/↓ recalls history.'
    ].join('\n')),

    bio: () => addLine(`Creativecole\nProfile: <a href="${profileUrl}" target="_blank" rel="noreferrer">github.com/Creativecole</a>`),

    github: () => {
      addLine(`Opening <a href="${profileUrl}" target="_blank" rel="noreferrer">github.com/Creativecole</a> …`);
      window.open(profileUrl, '_blank', 'noopener,noreferrer');
    },

    posts: () => addLine('Published writing:\n  <a href="/archives/">archives/</a>\n  <a href="/categories/">categories/</a>\n  <a href="/tags/">tags/</a>'),

    ls: ([target = '.']) => {
      const path = resolvePath(target);
      if (directories[path]) addLine(renderList(path));
      else if (files[path]) addLine(basename(path));
      else printError(`ls: ${target}: no such file or directory`);
    },

    cd: ([target = '/']) => {
      const path = resolvePath(target);
      if (directories[path]) {
        cwd = path;
        updatePrompt();
      } else if (files[path]) {
        printError(`cd: ${target}: not a directory`);
      } else {
        printError(`cd: ${target}: no such directory`);
      }
    },

    pwd: () => addLine(escapeHtml(cwd)),

    cat: ([target]) => {
      if (!target) {
        printError('cat: missing file operand');
        return;
      }
      const path = resolvePath(target);
      if (files[path]) addLine(renderFile(files[path]));
      else if (directories[path]) printError(`cat: ${target}: is a directory`);
      else printError(`cat: ${target}: no such file`);
    },

    open: ([target]) => {
      if (!target) printError('open: missing file operand');
      else openTarget(target);
    },

    tree: () => addLine('.\n├── github/\n│   └── profile\n├── posts/\n│   ├── archives/\n│   ├── categories/\n│   └── tags/\n├── bio\n├── help\n└── index'),

    date: () => addLine(new Intl.DateTimeFormat('en', { dateStyle: 'full', timeStyle: 'long' }).format(new Date())),

    clear: () => output.replaceChildren()
  };

  const run = (rawCommand) => {
    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    const [command, ...args] = trimmed.split(/\s+/);
    const normalizedCommand = command.toLowerCase();
    addLine(`${promptHtml()} ${escapeHtml(trimmed)}`, 'command');

    history.push(trimmed);
    historyIndex = history.length;

    if (!handlers[normalizedCommand]) {
      printError(`command not found: ${command}. Type “help”.`);
      return;
    }
    handlers[normalizedCommand](args);
  };

  const completionCandidates = (command, partial) => {
    if (!command) return commandNames;

    const pathCommands = ['cd', 'ls', 'cat', 'open'];
    if (!pathCommands.includes(command)) return [];

    const slash = partial.lastIndexOf('/');
    const prefix = slash >= 0 ? partial.slice(0, slash + 1) : '';
    const leaf = slash >= 0 ? partial.slice(slash + 1) : partial;
    const base = resolvePath(prefix || '.');
    let entries = pathEntries(base);

    if (command === 'cd') entries = entries.filter((entry) => entry.endsWith('/'));
    if (command === 'cat' || command === 'open') entries = entries.filter((entry) => !entry.endsWith('/'));

    return entries
      .filter((entry) => entry.startsWith(leaf))
      .map((entry) => `${prefix}${entry}`);
  };

  const commonPrefix = (values) => {
    if (!values.length) return '';
    return values.reduce((prefix, value) => {
      let index = 0;
      while (index < prefix.length && prefix[index] === value[index]) index += 1;
      return prefix.slice(0, index);
    });
  };

  const completeInput = () => {
    const match = input.value.match(/^(\s*)(\S*)(?:\s+(.*))?$/);
    if (!match) return;

    const leading = match[1];
    const command = match[2].toLowerCase();
    const hasArgument = match[3] !== undefined;
    const partial = hasArgument ? match[3] : command;
    const candidates = hasArgument
      ? completionCandidates(command, partial)
      : commandNames.filter((name) => name.startsWith(partial));

    if (!candidates.length) return;

    const completion = commonPrefix(candidates);
    const completedValue = hasArgument
      ? `${leading}${command} ${completion}`
      : `${leading}${completion}${candidates.length === 1 ? ' ' : ''}`;

    if (completedValue === input.value && candidates.length > 1) {
      addLine(candidates.map(entryHtml).join('  '), 'suggestions');
      form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      input.value = completedValue;
      input.setSelectionRange(input.value.length, input.value.length);
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    run(input.value);
    input.value = '';
    input.focus();
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      completeInput();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (historyIndex > 0) historyIndex -= 1;
      input.value = history[historyIndex] || '';
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex < history.length) historyIndex += 1;
      input.value = history[historyIndex] || '';
    }
  });

  document.querySelectorAll('[data-command]').forEach((control) => {
    control.addEventListener('click', () => {
      run(control.dataset.command);
      input.focus();
    });
  });

  document.querySelector('#year').textContent = new Date().getFullYear();
  updatePrompt();
  document.addEventListener('click', (event) => {
    if (!event.target.closest('a, button, input')) input.focus();
  });
})();
