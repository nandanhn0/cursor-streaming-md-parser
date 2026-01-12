"use strict";
const blogpostMarkdown = `# control

*humans should focus on bigger problems*

## Setup

\`\`\`bash
git clone git@github.com:anysphere/control
\`\`\`

\`\`\`bash
./init.sh
\`\`\`

## Folder structure

**The most important folders are:**

1. \`vscode\`: this is our fork of vscode, as a submodule.
2. \`milvus\`: this is where our Rust server code lives.
3. \`schema\`: this is our Protobuf definitions for communication between the client and the server.

Each of the above folders should contain fairly comprehensive README files; please read them. If something is missing, or not working, please add it to the README!

Some less important folders:

1. \`release\`: this is a collection of scripts and guides for releasing various things.
2. \`infra\`: infrastructure definitions for the on-prem deployment.
3. \`third_party\`: where we keep our vendored third party dependencies.

## Miscellaneous things that may or may not be useful

##### Where to find rust-proto definitions

They are in a file called \`aiserver.v1.rs\`. It might not be clear where that file is. Run \`rg --files --no-ignore bazel-out | rg aiserver.v1.rs\` to find the file.

## Releasing

Within \`vscode/\`:

- Bump the version
- Then:

\`\`\`
git checkout build-todesktop
git merge main
git push origin build-todesktop
\`\`\`

- Wait for 14 minutes for gulp and ~30 minutes for todesktop
- Go to todesktop.com, test the build locally and hit release
`;
let currentContainer = null;
// --- Global State for Parsing ---
let backtickBuffer = 0; // Buffers backticks to handle split tokens
let inCodeBlock = false; // Are we currently inside a ``` block?
let inInlineCode = false; // Are we currently inside a ` block?
let activeElement = null; // The element we are currently streaming text into
// Do not edit this method
function runStream() {
    currentContainer = document.getElementById('markdownContainer');
    // this randomly split the markdown into tokens between 2 and 20 characters long
    // simulates the behavior of an ml model thats giving you weirdly chunked tokens
    const tokens = [];
    let remainingMarkdown = blogpostMarkdown;
    while (remainingMarkdown.length > 0) {
        const tokenLength = Math.floor(Math.random() * 18) + 2;
        const token = remainingMarkdown.slice(0, tokenLength);
        tokens.push(token);
        remainingMarkdown = remainingMarkdown.slice(tokenLength);
    }
    const toCancel = setInterval(() => {
        const token = tokens.shift();
        if (token) {
            addToken(token);
        }
        else {
            clearInterval(toCancel);
        }
    }, 20);
}
function addToken(token) {
    if (!currentContainer)
        return;
    for (let i = 0; i < token.length; i++) {
        const char = token[i];
        if (char === '`') {
            backtickBuffer++;
        }
        else {
            // We hit a non-backtick character. 
            // First, resolve any backticks sitting in the buffer.
            if (backtickBuffer > 0) {
                resolveBackticks();
            }
            // Now process the current character
            appendChar(char);
        }
    }
    // Note: We DO NOT resolve backticks at the end of the token. 
    // We must wait for the next token to ensure we catch split triple-backticks.
}
function resolveBackticks() {
    const count = backtickBuffer;
    backtickBuffer = 0; // Reset buffer
    if (count >= 3) {
        // --- Code Block Logic ---
        if (inCodeBlock) {
            // Closing the block
            inCodeBlock = false;
            activeElement = null; // Return to writing to main container
        }
        else {
            // Opening a block
            inCodeBlock = true;
            const div = document.createElement('div');
            // Styling for code block
            div.style.backgroundColor = '#2d2d2d';
            div.style.color = '#f8f8f2';
            div.style.padding = '10px';
            div.style.borderRadius = '5px';
            div.style.fontFamily = 'monospace';
            div.style.whiteSpace = 'pre-wrap'; // Preserve formatting
            div.style.marginBottom = '10px';
            currentContainer.appendChild(div);
            activeElement = div;
        }
    }
    else if (count === 1) {
        // --- Inline Code Logic ---
        if (inCodeBlock) {
            // If inside a block, a single backtick is just content
            appendChar('`');
        }
        else {
            if (inInlineCode) {
                // Closing inline code
                inInlineCode = false;
                activeElement = null; // Return to writing to main container
            }
            else {
                // Opening inline code
                inInlineCode = true;
                const span = document.createElement('span');
                // Styling for inline code
                span.style.backgroundColor = '#e0e0e0';
                span.style.color = '#d63384';
                span.style.padding = '2px 4px';
                span.style.borderRadius = '4px';
                span.style.fontFamily = 'monospace';
                currentContainer.appendChild(span);
                activeElement = span;
            }
        }
    }
    else {
        // --- Edge Case (e.g. Double Backticks) ---
        // Treat as literal text
        for (let k = 0; k < count; k++) {
            appendChar('`');
        }
    }
}
function appendChar(char) {
    if (activeElement) {
        // If we are in a code block or inline code, append to that element
        activeElement.innerText += char;
    }
    else {
        // Otherwise, append to the main container
        // We use a simple text node or span to avoid resetting innerHTML
        // Optimisation: Try to append to the last child if it's a generic span to reduce DOM depth,
        // otherwise create a new span.
        const lastChild = currentContainer.lastElementChild;
        // Check if last child is a generic span (not our styled code blocks)
        if (lastChild && lastChild.tagName === 'SPAN' && !lastChild.style.backgroundColor) {
            lastChild.innerText += char;
        }
        else {
            const span = document.createElement('span');
            span.innerText = char;
            currentContainer.appendChild(span);
        }
    }
}
//# sourceMappingURL=MarkdownParser.js.map