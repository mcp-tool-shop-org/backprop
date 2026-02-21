import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  console.log('Backprop extension is now active!');

  // Register the "Run with Backprop" command
  let disposable = vscode.commands.registerCommand('backprop.run', async (uri?: vscode.Uri) => {
    // Determine the file to run
    let targetUri = uri;
    if (!targetUri && vscode.window.activeTextEditor) {
      targetUri = vscode.window.activeTextEditor.document.uri;
    }

    if (!targetUri || targetUri.scheme !== 'file') {
      vscode.window.showErrorMessage('Please open a Python file to run with Backprop.');
      return;
    }

    const filePath = targetUri.fsPath;
    const fileName = path.basename(filePath);

    // Create or show the Backprop terminal
    const terminalName = 'Backprop';
    let terminal = vscode.window.terminals.find(t => t.name === terminalName);
    if (!terminal) {
      terminal = vscode.window.createTerminal(terminalName);
    }
    
    terminal.show();
    
    // Run the backprop CLI command
    // Assuming `backprop` is installed globally or available in the workspace
    terminal.sendText(`backprop run "${filePath}" --name "VS Code: ${fileName}"`);
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
