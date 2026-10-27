window.__ModuleLoader__.load({
	id: "@yogurtss/dsh-teamflow",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let react_dom = require("react-dom");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region \0dsh-css:G:\dsh_agents\src\client\WorkflowWorkbench.module.css.mjs
		const css$4 = ".soVoAa_entry,.soVoAa_workbench,.soVoAa_contextPanel,.soVoAa_reviewNotice{--wb-bg:var(--dsw-alias-bg-layer-1,light-dark(#fff,#202226));--wb-base:var(--dsw-alias-bg-module-platform,light-dark(#f6f7f9,#181a1e));--wb-border:var(--dsw-alias-border-l2,light-dark(#e1e5eb,#363940));--wb-text:var(--dsw-alias-label-primary,light-dark(#26303d,#e3e6ec));--wb-muted:var(--dsw-alias-label-secondary,light-dark(#737d8b,#a0a8b5));--wb-accent:var(--dsw-alias-state-business-primary,light-dark(#2866d7,#82b4ff));--wb-error:var(--dsw-alias-state-error-primary,light-dark(#b94444,#ef9797));color:var(--wb-text);font-variant-numeric:tabular-nums;font-family:inherit}.soVoAa_entry{border:1px solid var(--wb-border);background:var(--wb-bg);cursor:pointer;border-radius:9px;margin:8px 0 16px;padding:9px 13px;font-size:12px}.soVoAa_entry:hover{border-color:var(--wb-accent)}.soVoAa_startEntry{width:100%;color:var(--wb-accent);border-color:var(--wb-accent);margin-top:0;font-weight:650}.soVoAa_startEntry:disabled{opacity:.5;cursor:not-allowed}.soVoAa_pendingNotice{background:color-mix(in srgb, var(--wb-accent) 9%, var(--wb-bg));color:var(--wb-text);border:1px solid color-mix(in srgb, var(--wb-accent) 35%, var(--wb-border));flex-wrap:wrap;align-items:center;gap:8px;padding:9px 12px;font-size:12px;display:flex}.soVoAa_pendingNotice button{font:inherit;color:var(--wb-accent);background:var(--wb-bg);border:1px solid var(--wb-border);cursor:pointer;border-radius:6px;padding:4px 8px}.soVoAa_pendingNotice button:disabled{opacity:.5;cursor:not-allowed}.soVoAa_pendingNotice small{color:var(--wb-muted)}.soVoAa_launcher{z-index:3;box-sizing:border-box;text-align:left;width:100%;color:var(--wb-accent);border-color:color-mix(in srgb, var(--wb-accent) 45%, var(--wb-border));background:color-mix(in srgb, var(--wb-accent) 9%, var(--wb-bg));box-shadow:0 2px 6px color-mix(in srgb, var(--wb-text) 5%, transparent);flex-direction:column;align-items:flex-start;gap:4px;padding:13px 16px;display:flex;position:sticky;top:0}.soVoAa_launcher strong{justify-content:space-between;gap:12px;width:100%;font-size:15px;display:flex}.soVoAa_launcher>span{overflow-wrap:anywhere;font-size:12px}.soVoAa_launcher:hover{background:color-mix(in srgb, var(--wb-accent) 15%, var(--wb-bg))}.soVoAa_historyDialog{box-sizing:border-box;cursor:auto;width:min(1100px,100vw - 32px);max-height:calc(100vh - 48px);margin:auto;padding:20px;position:fixed;overflow:auto}.soVoAa_historyDialog::backdrop{background:#0006}.soVoAa_historyDialog>header{justify-content:space-between;align-items:center;gap:16px;margin-bottom:16px;display:flex}.soVoAa_historyDialog>header p{color:var(--wb-muted);margin:4px 0 0}.soVoAa_historyDialog>header button{color:var(--wb-text);background:var(--wb-bg);border:1px solid var(--wb-border);cursor:pointer;border-radius:8px;padding:7px 14px}.soVoAa_workbench{z-index:1000;background:var(--wb-base);border:1px solid var(--wb-border);box-shadow:0 16px 64px color-mix(in srgb, var(--dsw-alias-bg-mask-3,#000) 20%, transparent);border-radius:16px;flex-direction:column;font-size:13px;line-height:1.65;display:flex;position:fixed;inset:24px;overflow:hidden}.soVoAa_workbench *{box-sizing:border-box}.soVoAa_workbench button{font:inherit;color:inherit;background:var(--wb-bg);border:1px solid var(--wb-border);cursor:pointer;border-radius:8px;padding:6px 10px;font-size:12px;line-height:20px;transition:background-color .14s,border-color .14s}.soVoAa_workbench button:hover:not(:disabled){background:color-mix(in srgb, var(--wb-accent) 5%, var(--wb-bg));border-color:color-mix(in srgb, var(--wb-accent) 40%, var(--wb-border))}.soVoAa_workbench button:disabled{opacity:.42;cursor:default}.soVoAa_workbench button:focus-visible,.soVoAa_workbench input:focus-visible,.soVoAa_workbench textarea:focus-visible,.soVoAa_workbench select:focus-visible,.soVoAa_entry:focus-visible{outline:2px solid var(--wb-accent);outline-offset:2px}.soVoAa_workbench .soVoAa_primary{border-color:color-mix(in srgb, var(--wb-accent) 35%, var(--wb-border));color:var(--wb-accent);background:color-mix(in srgb, var(--wb-accent) 9%, var(--wb-bg));font-weight:600}.soVoAa_workbench .soVoAa_primary:hover:not(:disabled){background:color-mix(in srgb, var(--wb-accent) 15%, var(--wb-bg))}.soVoAa_workbench .soVoAa_danger{color:var(--wb-error)}.soVoAa_header{background:var(--wb-bg);border-bottom:1px solid var(--wb-border);flex:none;justify-content:space-between;align-items:center;gap:12px;padding:16px 20px;display:flex}.soVoAa_title{align-items:center;gap:10px;min-width:0;display:flex}.soVoAa_title img{flex:none;width:36px;height:36px}.soVoAa_title>div{min-width:0}.soVoAa_title strong{text-overflow:ellipsis;white-space:nowrap;font-size:15px;font-weight:650;display:block;overflow:hidden}.soVoAa_title span{color:var(--wb-muted);font-size:11px;display:block}.soVoAa_header>div:last-child{flex:none;gap:8px;display:flex}.soVoAa_paneTabs{display:none}.soVoAa_columns{flex:1;grid-template-columns:220px minmax(280px,1fr) 350px;min-height:0;display:grid}.soVoAa_roster{background:var(--wb-bg);border-right:1px solid var(--wb-border);padding:16px 12px;overflow:auto}.soVoAa_roster h3{justify-content:space-between;align-items:center;margin:0 0 16px;font-size:12px;font-weight:600;display:flex}.soVoAa_roster h3 button{color:var(--wb-muted);border:0;padding:2px 6px}.soVoAa_roster article{border:1px solid var(--wb-border);background:var(--wb-bg);border-radius:10px;margin-bottom:10px;padding:12px}.soVoAa_roster .soVoAa_member{text-align:left;background:0 0;border:0;gap:9px;width:100%;padding:0;display:flex}.soVoAa_member img{flex:none;width:32px;height:32px}.soVoAa_member>span{min-width:0}.soVoAa_member strong{overflow-wrap:anywhere;font-size:12px;display:block}.soVoAa_member span>span{color:var(--wb-muted);white-space:pre-wrap;overflow-wrap:anywhere;margin-top:3px;font-size:11px;line-height:1.7;display:block}.soVoAa_roster small{color:var(--wb-muted);overflow-wrap:anywhere;margin:9px 0 4px;font-size:10px;display:block}.soVoAa_roster article>div{flex-wrap:wrap;gap:4px;display:flex}.soVoAa_roster article>div button{background:0 0;border-color:#0000;padding:2px 6px;font-size:11px}.soVoAa_hint{color:var(--wb-muted);font-size:12px;line-height:1.8}.soVoAa_selected{outline:2px solid color-mix(in srgb, var(--wb-accent) 65%, transparent);outline-offset:-1px}.soVoAa_node[data-member-match]{border-color:var(--wb-accent);box-shadow:0 0 0 3px color-mix(in srgb, var(--wb-accent) 22%, transparent)}.soVoAa_memberModelSettings{background:var(--wb-base);border:1px solid var(--wb-border);border-radius:8px;padding:10px}.soVoAa_graphArea{flex-direction:column;min-width:0;min-height:0;display:flex}.soVoAa_toolbar{border-bottom:1px solid var(--wb-border);background:var(--wb-bg);flex-wrap:wrap;align-items:center;gap:6px;padding:12px;display:flex}.soVoAa_toolbar span{color:var(--wb-muted);flex-basis:100%;margin-top:2px;font-size:11px}.soVoAa_canvas{background-color:var(--wb-base);background-image:radial-gradient(color-mix(in srgb, var(--wb-muted) 16%, transparent) 1px, transparent 1px);background-size:20px 20px;flex:1;min-height:180px;position:relative;overflow:auto}.soVoAa_plane{position:relative}.soVoAa_edges{pointer-events:none;width:100%;height:100%;color:color-mix(in srgb, var(--wb-muted) 65%, var(--wb-border));position:absolute;overflow:visible}.soVoAa_edges>path{fill:none;stroke:currentColor;stroke-width:1.5px}.soVoAa_node{touch-action:none;background:var(--wb-bg);border:1px solid var(--wb-border);width:225px;box-shadow:0 2px 5px color-mix(in srgb, var(--wb-text) 4%, transparent);border-radius:10px;position:absolute}.soVoAa_checkpoint{border-color:color-mix(in srgb, var(--wb-accent) 35%, var(--wb-border))}.soVoAa_drag{cursor:grab;color:var(--wb-muted);border-bottom:1px solid var(--wb-border);touch-action:none;user-select:none;padding:6px 11px;font-size:10px}.soVoAa_workbench .soVoAa_nodeBody{text-align:left;background:0 0;border:0;border-radius:0 0 10px 10px;flex-direction:column;gap:7px;width:100%;padding:11px;display:flex}.soVoAa_nodeBody strong{overflow-wrap:anywhere;font-size:12px}.soVoAa_nodeBody .soVoAa_taskOwner{color:var(--wb-muted);align-items:center;gap:5px;font-size:11px;display:flex}.soVoAa_taskOwner img{width:20px;height:20px}.soVoAa_nodeBody small{background:var(--wb-base);color:var(--wb-muted);border-radius:5px;align-self:flex-start;padding:1px 6px;font-size:10px}.soVoAa_nodeBody small[data-ready=true]{color:var(--wb-accent);background:color-mix(in srgb, var(--wb-accent) 8%, var(--wb-bg))}.soVoAa_workbench .soVoAa_port{background:var(--wb-bg);border:2px solid var(--wb-accent);touch-action:none;border-radius:50%;width:14px;height:14px;padding:0;position:absolute;top:48px}.soVoAa_workbench .soVoAa_port:hover{background:var(--wb-accent)}.soVoAa_input{left:-7px}.soVoAa_output{right:-7px}.soVoAa_empty{max-width:380px;color:var(--wb-muted);padding:32px}.soVoAa_notice{background:color-mix(in srgb, var(--wb-accent) 6%, var(--wb-bg));border-bottom:1px solid var(--wb-border);color:var(--wb-muted);padding:10px 12px;font-size:12px}.soVoAa_notice button{color:var(--wb-accent);background:0 0;border-color:#0000;margin-left:8px}.soVoAa_details{border-top:1px solid var(--wb-border);background:var(--wb-bg);max-height:180px;padding:12px 16px;overflow:auto}.soVoAa_details strong{font-size:12px}.soVoAa_details p{white-space:pre-wrap;color:var(--wb-muted);margin:5px 0 9px;font-size:12px}.soVoAa_details>div{flex-wrap:wrap;gap:6px;display:flex}.soVoAa_discussion{border-left:1px solid var(--wb-border);background:var(--wb-bg);flex-direction:column;min-width:0;min-height:0;display:flex}.soVoAa_discussion>header{border-bottom:1px solid var(--wb-border);align-items:center;gap:9px;padding:14px 16px;display:flex}.soVoAa_discussion>header img{flex:none;width:32px;height:32px}.soVoAa_discussion h3{margin:0;font-size:12px;font-weight:600}.soVoAa_discussion small{color:var(--wb-muted);font-size:11px}.soVoAa_messages{overscroll-behavior:contain;flex:1;min-height:80px;padding:16px;overflow:auto}.soVoAa_messages p{white-space:pre-wrap;overflow-wrap:anywhere;margin:5px 0;font-size:12px;line-height:1.85}.soVoAa_materials{border:1px solid var(--wb-border);background:var(--wb-base);border-radius:8px;margin:10px 0 16px;padding:12px}.soVoAa_materials section{border-bottom:1px solid var(--wb-border);margin:12px 0;padding-bottom:10px}.soVoAa_materials strong{font-size:12px}.soVoAa_materials .soVoAa_hint{font-size:11px}.soVoAa_userMessage,.soVoAa_assistantMessage{border-radius:10px;margin-bottom:14px;padding:10px 12px}.soVoAa_userMessage{background:color-mix(in srgb, var(--wb-accent) 7%, var(--wb-bg));margin-left:20px}.soVoAa_assistantMessage{background:var(--wb-base);margin-right:8px}.soVoAa_embeddedTranscript{max-height:45vh;padding:8px 0;overflow:auto}.soVoAa_embeddedTranscript p{white-space:pre-wrap;overflow-wrap:anywhere}.soVoAa_embeddedComposer{gap:6px;margin:8px 0 16px;display:grid}.soVoAa_embeddedComposer label{gap:4px;display:grid}.soVoAa_embeddedComposer textarea{resize:vertical;width:100%;min-height:68px}.soVoAa_embeddedComposer button{justify-self:end}.soVoAa_discussion summary{cursor:pointer;color:var(--wb-muted);font-size:12px}.soVoAa_discussion pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;max-height:230px;font-size:12px;line-height:1.75;overflow:auto}.soVoAa_proposal{background:color-mix(in srgb, var(--wb-accent) 4%, var(--wb-bg));border-top:1px solid var(--wb-border);flex-shrink:0;max-height:68%;padding:12px 16px;overflow:auto}.soVoAa_proposal strong{font-size:12px}.soVoAa_proposal button{margin:8px 6px 0 0}.soVoAa_decisions{border-top:1px solid var(--wb-border);flex-wrap:wrap;gap:8px;padding:12px 16px;display:flex}.soVoAa_composer{border-top:1px solid var(--wb-border);padding:12px 16px}.soVoAa_composer textarea{resize:vertical;width:100%;height:76px;max-height:180px}.soVoAa_composer>div{flex-wrap:wrap;gap:6px;margin-top:8px;display:flex}.soVoAa_composer>div button:not(.soVoAa_primary){color:var(--wb-muted);border-color:#0000;padding-left:6px;padding-right:6px}.soVoAa_workbench input,.soVoAa_workbench textarea,.soVoAa_workbench select{font:inherit;color:inherit;background:var(--wb-bg);border:1px solid var(--wb-border);accent-color:var(--wb-accent);border-radius:8px;padding:8px 10px;font-size:12px}.soVoAa_workbench textarea::placeholder{color:var(--wb-muted)}.soVoAa_error{background:color-mix(in srgb, var(--wb-error) 7%, var(--wb-bg));border-bottom:1px solid var(--wb-border);white-space:pre-wrap;color:var(--wb-error);padding:10px 20px;font-size:12px}.soVoAa_create{background:var(--wb-bg);border:1px solid var(--wb-border);border-radius:12px;width:100%;max-width:540px;margin:32px auto;padding:24px}.soVoAa_create h2{font-size:16px;font-weight:600}.soVoAa_create label,.soVoAa_editor>label{flex-direction:column;gap:5px;margin:14px 0;font-size:12px;display:flex}.soVoAa_create textarea{min-height:100px}.soVoAa_editor{background:var(--wb-bg);border-left:1px solid var(--wb-border);min-width:0;min-height:0;padding:18px;overflow:auto}.soVoAa_editor h3{margin:0 0 16px;font-size:15px;font-weight:600}.soVoAa_editor textarea{resize:vertical;min-height:68px}.soVoAa_editor fieldset{border:1px solid var(--wb-border);border-radius:8px;padding:12px;font-size:12px}.soVoAa_editor fieldset label{align-items:center;gap:8px;margin:5px 0;display:flex}.soVoAa_editor footer{flex-wrap:wrap;gap:8px;margin-top:20px;display:flex}@media (width<=1100px){.soVoAa_columns{grid-template-columns:180px minmax(260px,1fr) 310px}.soVoAa_workbench{inset:12px}}@media (width<=900px){.soVoAa_workbench{border-radius:12px;inset:8px}.soVoAa_header{padding:12px}.soVoAa_title strong{font-size:13px}.soVoAa_title img{width:30px;height:30px}.soVoAa_paneTabs{border-bottom:1px solid var(--wb-border);background:var(--wb-bg);flex:none;gap:4px;padding:6px 12px;display:flex}.soVoAa_paneTabs button{color:var(--wb-muted);background:0 0;border-color:#0000;flex:1}.soVoAa_paneTabs button[aria-pressed=true]{color:var(--wb-accent);background:color-mix(in srgb, var(--wb-accent) 8%, var(--wb-bg))}.soVoAa_paneTabs i{background:var(--wb-accent);border-radius:50%;width:5px;height:5px;margin:0 0 2px 6px;display:inline-block}.soVoAa_columns{display:flex;overflow:hidden}.soVoAa_columns>aside,.soVoAa_columns>main{border:0;width:100%;display:none}.soVoAa_columns[data-pane=members]>.soVoAa_roster{display:block}.soVoAa_columns[data-pane=flow]>.soVoAa_graphArea,.soVoAa_columns[data-pane=discussion]>.soVoAa_discussion{display:flex}.soVoAa_roster{padding:16px}.soVoAa_roster article{max-width:620px;margin:0 auto 10px}.soVoAa_toolbar span{flex-basis:auto;margin-left:auto}.soVoAa_proposal{max-height:36%}.soVoAa_editorBackdrop{padding:12px}}@media (width<=450px){.soVoAa_title span{display:none}.soVoAa_header{gap:6px}.soVoAa_header>div:last-child{gap:4px}.soVoAa_toolbar span{display:none}.soVoAa_workbench{border-radius:0;inset:0}.soVoAa_header button{padding:5px 7px}}@media (prefers-reduced-motion:reduce){.soVoAa_workbench button{transition:none}}.soVoAa_nativeBanner{flex-wrap:wrap;align-items:center;gap:8px;font-size:12px;display:flex}.soVoAa_node[data-connection=valid]{outline:2px solid var(--wb-accent);box-shadow:0 0 0 7px color-mix(in srgb, var(--wb-accent) 12%, transparent)}.soVoAa_node[data-connection=valid] .soVoAa_input{background:var(--wb-accent);transform:scale(1.4)}.soVoAa_node[data-connection=invalid]{outline:2px solid var(--wb-error)}.soVoAa_discussion{overflow-y:auto}.soVoAa_entry.soVoAa_compact,.soVoAa_nativeBanner .soVoAa_entry{margin:0;padding:4px 8px;font-size:11px}.soVoAa_nativeBanner>span{text-overflow:ellipsis;white-space:nowrap;max-width:180px;overflow:hidden}.soVoAa_workbench[data-editing=true] .soVoAa_paneTabs{display:none}.soVoAa_columns[data-editing=true]{grid-template-columns:220px minmax(280px,1fr) 350px;display:grid}.soVoAa_columns[data-editing=true]>.soVoAa_roster{display:block}.soVoAa_columns[data-editing=true]>.soVoAa_discussion{display:none}.soVoAa_columns[data-editing=true]>.soVoAa_graphArea{display:flex}.soVoAa_draftNode{border:2px dashed var(--wb-accent);pointer-events:none}.soVoAa_editor footer{background:var(--wb-bg);border-top:1px solid var(--wb-border);padding:12px 0;position:sticky;bottom:-18px}.soVoAa_contextPanel{border:1px solid var(--wb-border);background:var(--wb-bg);overflow-wrap:anywhere;border-radius:10px;margin-bottom:16px;padding:14px;font-size:12px;line-height:1.75}.soVoAa_contextPanel>header{flex-wrap:wrap;align-items:baseline;gap:8px;margin-bottom:12px;display:flex}.soVoAa_contextPanel>header span{color:var(--wb-muted);font-size:11px}.soVoAa_contextPanel>label{flex-direction:column;gap:4px;display:flex}.soVoAa_contextPanel select,.soVoAa_contextPanel button{font:inherit;color:inherit;border:1px solid var(--wb-border);background:var(--wb-bg);border-radius:6px;max-width:100%;padding:6px 8px}.soVoAa_contextPanel button,.soVoAa_contextPanel summary{cursor:pointer}.soVoAa_contextPanel :is(button,select,summary):focus-visible{outline:2px solid var(--wb-accent);outline-offset:2px}.soVoAa_contextPanel button:hover{border-color:var(--wb-accent)}.soVoAa_contextInfo h4{margin:16px 0 8px;font-size:12px}.soVoAa_contextInfo p,.soVoAa_contextInfo dd{white-space:pre-wrap;overflow-wrap:anywhere;margin:6px 0 12px;font-size:12px}.soVoAa_contextInfo dt{color:var(--wb-muted);font-size:11px}.soVoAa_contextInfo summary{cursor:pointer;font-size:12px}.soVoAa_contextInfo pre,.soVoAa_contextPanel pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;max-height:300px;overflow:auto}.soVoAa_contextTask{border-top:1px solid var(--wb-border);padding:10px 0}.soVoAa_contextInfo .soVoAa_contextMember{text-align:left;flex-direction:column;gap:3px;width:100%;margin:6px 0;display:flex}.soVoAa_contextMember span{color:var(--wb-muted);font-size:11px}.soVoAa_contextProposal{border-top:1px solid var(--wb-border);margin-top:12px;padding-top:12px}.soVoAa_contextProposal pre{border:1px solid var(--wb-border);background:var(--wb-base);border-radius:6px;padding:9px}.soVoAa_contextActions{gap:8px;margin:8px 0;display:flex}.soVoAa_contextPanel .soVoAa_confirmProposal{color:var(--wb-accent);border-color:var(--wb-accent);font-weight:600}.soVoAa_contextPanel button:disabled{opacity:.5;cursor:wait}@media (width<=900px){.soVoAa_columns[data-editing=true]{grid-template-rows:minmax(220px,1fr) minmax(220px,45%);grid-template-columns:150px minmax(220px,1fr);overflow:auto}.soVoAa_columns[data-editing=true]>.soVoAa_roster{grid-row:1/3;width:auto;padding:10px}.soVoAa_columns[data-editing=true]>.soVoAa_editor{grid-column:2}.soVoAa_columns[data-editing=true]>.soVoAa_graphArea{width:auto}.soVoAa_columns[data-editing=true] .soVoAa_canvas{min-height:100px}.soVoAa_columns[data-editing=true] .soVoAa_toolbar{padding:8px}.soVoAa_columns[data-editing=true] .soVoAa_toolbar span{flex-basis:100%;display:block}.soVoAa_editor{border-left:0;border-top:1px solid var(--wb-border);padding:14px}.soVoAa_editor footer{bottom:-14px}}.soVoAa_edge path{fill:none;stroke:var(--wb-muted);stroke-width:2px}.soVoAa_edge .soVoAa_edgeHit{stroke:#0000;stroke-width:16px;pointer-events:stroke;cursor:pointer}.soVoAa_edge[data-selected=true]>path:first-child,.soVoAa_edge:focus-within>path:first-child{stroke:var(--wb-accent);stroke-width:3px}.soVoAa_edgeHit:focus{outline:none}.soVoAa_workbench .soVoAa_output{background:0 0;border:0;border-radius:4px;width:30px;right:-23px}.soVoAa_output:before{content:\"\";border-top:2px solid var(--wb-accent);position:absolute;top:5px;left:0;right:4px}.soVoAa_output:after{content:\"\";border-top:2px solid var(--wb-accent);border-right:2px solid var(--wb-accent);width:6px;height:6px;position:absolute;top:2px;right:3px;transform:rotate(45deg)}.soVoAa_workbench .soVoAa_output:hover{background:color-mix(in srgb, var(--wb-accent) 15%, transparent)}@media (width<=520px){.soVoAa_columns[data-editing=true]{grid-template-rows:140px 240px minmax(250px,1fr);grid-template-columns:minmax(0,1fr)}.soVoAa_columns[data-editing=true]>.soVoAa_roster{grid-row:auto}.soVoAa_columns[data-editing=true]>.soVoAa_editor{grid-column:1}}.soVoAa_checkpoint{border:2px dashed var(--wb-accent);border-radius:18px}.soVoAa_checkpoint .soVoAa_drag{color:var(--wb-accent);font-weight:600}.soVoAa_node[data-review-ready=true]{outline:3px solid color-mix(in srgb, var(--wb-accent) 20%, transparent);border-style:solid}.soVoAa_reviewNotice{border:1px solid var(--wb-accent);background:color-mix(in srgb, var(--wb-accent) 8%, var(--wb-bg));border-radius:10px;flex-wrap:wrap;align-items:center;gap:8px;margin:6px 0;padding:8px 10px;font-size:12px;display:flex}.soVoAa_reviewNotice strong{align-items:center;gap:6px;display:inline-flex}.soVoAa_reviewNotice small{color:var(--wb-muted);flex-basis:100%}.soVoAa_reviewNotice button{font:inherit;color:var(--wb-accent);background:var(--wb-bg);border:1px solid var(--wb-border);cursor:pointer;border-radius:6px;padding:5px 8px}.soVoAa_reviewNotice button:focus-visible{outline:2px solid var(--wb-accent);outline-offset:2px}.soVoAa_reviewNotice button:disabled{cursor:wait;opacity:.6}.soVoAa_reviewDot{background:var(--wb-accent);border-radius:50%;width:8px;height:8px;animation:2s ease-in-out infinite soVoAa_reviewPulse}@keyframes soVoAa_reviewPulse{50%{box-shadow:0 0 0 5px color-mix(in srgb, var(--wb-accent) 18%, transparent)}}@media (prefers-reduced-motion:reduce){.soVoAa_reviewDot{animation:none}}@media (width>=1101px){.soVoAa_columns[data-approving=true]{grid-template-columns:200px minmax(240px,1fr) minmax(420px,42%)}}";
		const tagId$4 = "@yogurtss/dsh-teamflow/WorkflowWorkbench.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@yogurtss/dsh-teamflow";
			tag.dataset.pluginCss = tagId$4;
			tag.textContent = css$4;
			document.head.appendChild(tag);
		}
		var WorkflowWorkbench_module_css_default = {
			"assistantMessage": "soVoAa_assistantMessage",
			"canvas": "soVoAa_canvas",
			"checkpoint": "soVoAa_checkpoint",
			"columns": "soVoAa_columns",
			"compact": "soVoAa_compact",
			"composer": "soVoAa_composer",
			"confirmProposal": "soVoAa_confirmProposal",
			"contextActions": "soVoAa_contextActions",
			"contextInfo": "soVoAa_contextInfo",
			"contextMember": "soVoAa_contextMember",
			"contextPanel": "soVoAa_contextPanel",
			"contextProposal": "soVoAa_contextProposal",
			"contextTask": "soVoAa_contextTask",
			"create": "soVoAa_create",
			"danger": "soVoAa_danger",
			"decisions": "soVoAa_decisions",
			"details": "soVoAa_details",
			"discussion": "soVoAa_discussion",
			"draftNode": "soVoAa_draftNode",
			"drag": "soVoAa_drag",
			"edge": "soVoAa_edge",
			"edgeHit": "soVoAa_edgeHit",
			"edges": "soVoAa_edges",
			"editor": "soVoAa_editor",
			"editorBackdrop": "soVoAa_editorBackdrop",
			"embeddedComposer": "soVoAa_embeddedComposer",
			"embeddedTranscript": "soVoAa_embeddedTranscript",
			"empty": "soVoAa_empty",
			"entry": "soVoAa_entry",
			"error": "soVoAa_error",
			"graphArea": "soVoAa_graphArea",
			"header": "soVoAa_header",
			"hint": "soVoAa_hint",
			"historyDialog": "soVoAa_historyDialog",
			"input": "soVoAa_input",
			"launcher": "soVoAa_launcher",
			"materials": "soVoAa_materials",
			"member": "soVoAa_member",
			"memberModelSettings": "soVoAa_memberModelSettings",
			"messages": "soVoAa_messages",
			"nativeBanner": "soVoAa_nativeBanner",
			"node": "soVoAa_node",
			"nodeBody": "soVoAa_nodeBody",
			"notice": "soVoAa_notice",
			"output": "soVoAa_output",
			"paneTabs": "soVoAa_paneTabs",
			"pendingNotice": "soVoAa_pendingNotice",
			"plane": "soVoAa_plane",
			"port": "soVoAa_port",
			"primary": "soVoAa_primary",
			"proposal": "soVoAa_proposal",
			"reviewDot": "soVoAa_reviewDot",
			"reviewNotice": "soVoAa_reviewNotice",
			"reviewPulse": "soVoAa_reviewPulse",
			"roster": "soVoAa_roster",
			"selected": "soVoAa_selected",
			"startEntry": "soVoAa_startEntry",
			"taskOwner": "soVoAa_taskOwner",
			"title": "soVoAa_title",
			"toolbar": "soVoAa_toolbar",
			"userMessage": "soVoAa_userMessage",
			"workbench": "soVoAa_workbench"
		};
		//#endregion
		//#region lib/client/WorkflowContext.js
		const statuses = {
			pending: "等待执行",
			claimed: "已领取",
			in_progress: "执行中",
			completed: "已完成",
			failed: "失败",
			cancelled: "已取消"
		};
		function TaskRecord({ task, team }) {
			return (0, react_jsx_runtime.jsxs)("details", {
				className: WorkflowWorkbench_module_css_default.contextTask,
				open: task.status === "in_progress",
				children: [
					(0, react_jsx_runtime.jsxs)("summary", { children: [
						task.subject,
						" · ",
						task.workflowPaused ? "已暂停" : statuses[task.status]
					] }),
					(0, react_jsx_runtime.jsx)("p", { children: task.description || "未单独填写任务说明" }),
					(0, react_jsx_runtime.jsxs)("p", { children: [(0, react_jsx_runtime.jsx)("strong", { children: "输入来自：" }), task.dependencies.map((id) => team.tasks.find((t) => t.id === id)?.subject ?? id).join("、") || "无前置任务"] }),
					task.objective && (0, react_jsx_runtime.jsxs)("p", { children: [(0, react_jsx_runtime.jsx)("strong", { children: "目标：" }), task.objective] }),
					!!task.inScope?.length && (0, react_jsx_runtime.jsxs)("p", { children: [(0, react_jsx_runtime.jsx)("strong", { children: "工作范围：" }), task.inScope.join("、")] }),
					!!task.outOfScope?.length && (0, react_jsx_runtime.jsxs)("p", { children: [(0, react_jsx_runtime.jsx)("strong", { children: "范围之外：" }), task.outOfScope.join("、")] }),
					!!task.acceptance?.length && (0, react_jsx_runtime.jsxs)("p", { children: [(0, react_jsx_runtime.jsx)("strong", { children: "验收标准：" }), task.acceptance.join("；")] }),
					!!task.verify?.length && (0, react_jsx_runtime.jsxs)("p", { children: [(0, react_jsx_runtime.jsx)("strong", { children: "计划验证：" }), task.verify.join("；")] }),
					!!task.deliverables?.length && (0, react_jsx_runtime.jsxs)("p", { children: [(0, react_jsx_runtime.jsx)("strong", { children: "约定交付：" }), task.deliverables.join("、")] }),
					(0, react_jsx_runtime.jsxs)("p", { children: [(0, react_jsx_runtime.jsx)("strong", { children: "已提交结果：" }), task.output || "尚未提交结果"] }),
					!!task.changedPaths?.length && (0, react_jsx_runtime.jsxs)("p", { children: [(0, react_jsx_runtime.jsx)("strong", { children: "已报告变更：" }), task.changedPaths.join("、")] }),
					task.commandsRun?.map((item, i) => (0, react_jsx_runtime.jsxs)("p", { children: [
						(0, react_jsx_runtime.jsxs)("strong", { children: [item.status === "passed" ? "报告通过" : "报告失败", "："] }),
						item.command,
						item.evidence ? `\n${item.evidence}` : ""
					] }, `cmd:${i}`)),
					task.acceptanceResults?.map((item, i) => (0, react_jsx_runtime.jsxs)("p", { children: [
						item.criterion,
						" · ",
						item.status === "passed" ? "报告通过" : "报告失败",
						item.evidence ? `\n${item.evidence}` : ""
					] }, `result:${i}`)),
					!!task.findings?.length && (0, react_jsx_runtime.jsxs)("details", { children: [(0, react_jsx_runtime.jsx)("summary", { children: "审查发现" }), (0, react_jsx_runtime.jsx)("pre", { children: JSON.stringify(task.findings, null, 2) })] }),
					!!task.stoppedAttempts?.length && (0, react_jsx_runtime.jsxs)("details", { children: [(0, react_jsx_runtime.jsxs)("summary", { children: [
						"停止前的记录 · ",
						task.stoppedAttempts.length,
						" 次"
					] }), task.stoppedAttempts.map((attempt, i) => (0, react_jsx_runtime.jsx)("p", { children: attempt.output || "本次停止前未提交结果" }, i))] })
				]
			});
		}
		function WorkflowContext({ team, discussion, onSelect, openExecution }) {
			const member = discussion.startsWith("member:") ? team.members.find((m) => m.name === discussion.slice(7)) : void 0;
			const gate = discussion.startsWith("check:") ? team.tasks.find((t) => t.id === discussion.slice(6)) : void 0;
			const tasks = member ? team.tasks.filter((t) => t.assignee === member.name) : gate ? team.tasks.filter((t) => gate.dependencies.includes(t.id)) : team.tasks;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: WorkflowWorkbench_module_css_default.contextInfo,
				children: [
					member ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						(0, react_jsx_runtime.jsxs)("section", { children: [
							(0, react_jsx_runtime.jsxs)("h4", { children: [member.name, " · 当前配置"] }),
							(0, react_jsx_runtime.jsx)("p", { children: member.summary || member.role || "尚未填写职责概述" }),
							(0, react_jsx_runtime.jsxs)("dl", { children: [
								(0, react_jsx_runtime.jsx)("dt", { children: "长期职责" }),
								(0, react_jsx_runtime.jsx)("dd", { children: member.role || "未单独设置" }),
								(0, react_jsx_runtime.jsx)("dt", { children: "PE · 成员执行指令" }),
								(0, react_jsx_runtime.jsx)("dd", { children: member.executionPrompt || "未单独设置；执行时可能沿用团队或插件指令" }),
								(0, react_jsx_runtime.jsx)("dt", { children: "模型" }),
								(0, react_jsx_runtime.jsxs)("dd", { children: [member.activeModel ?? member.model ?? "未记录", member.fallbackActive ? "（已切换备用模型）" : ""] })
							] })
						] }),
						(0, react_jsx_runtime.jsxs)("details", { children: [
							(0, react_jsx_runtime.jsx)("summary", { children: "本次执行的角色提示词快照" }),
							(0, react_jsx_runtime.jsx)("p", {
								className: WorkflowWorkbench_module_css_default.hint,
								children: "由插件按团队目标、角色、执行指令和协作规则组装；不等于完整模型请求。"
							}),
							member.runtimeSetup?.persona ? (0, react_jsx_runtime.jsx)("pre", { children: member.runtimeSetup.persona }) : (0, react_jsx_runtime.jsx)("p", { children: member.id ? "当前记录没有保存该快照，可打开执行对话核对。" : "尚无执行快照；成员启动后会保存角色提示词。" })
						] }),
						member.id && openExecution && (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => void openExecution(member.id, team.captainSessionId),
							children: "查看执行对话与工具记录 ↗"
						})
					] }) : gate ? (0, react_jsx_runtime.jsxs)("section", { children: [
						(0, react_jsx_runtime.jsxs)("h4", { children: [
							gate.subject,
							" · 第 ",
							gate.checkpoint?.round ?? 1,
							" 轮"
						] }),
						(0, react_jsx_runtime.jsx)("p", { children: gate.description || "未填写验收要求" }),
						(0, react_jsx_runtime.jsx)("p", { children: gate.checkpoint?.decision === "approve" ? "已通过" : gate.checkpoint?.decision === "reject" ? "已退回" : "等待人工决定" }),
						gate.checkpoint?.note && (0, react_jsx_runtime.jsx)("p", { children: gate.checkpoint.note })
					] }) : (0, react_jsx_runtime.jsxs)("section", { children: [
						(0, react_jsx_runtime.jsx)("h4", { children: "团队目标" }),
						(0, react_jsx_runtime.jsx)("p", { children: team.description || "未填写目标" }),
						(0, react_jsx_runtime.jsx)("h4", { children: "成员与分工" }),
						team.members.filter((m) => m.status !== "removed").map((m) => (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: WorkflowWorkbench_module_css_default.contextMember,
							onClick: () => onSelect?.(`member:${m.name}`),
							children: [(0, react_jsx_runtime.jsx)("strong", { children: m.name }), (0, react_jsx_runtime.jsx)("span", { children: m.summary || m.role || "尚未填写职责" })]
						}, m.name))
					] }),
					(0, react_jsx_runtime.jsx)("h4", { children: member ? "负责的任务与成果" : gate ? "直接上游的提交记录" : "任务与成果" }),
					!tasks.length && (0, react_jsx_runtime.jsx)("p", {
						className: WorkflowWorkbench_module_css_default.hint,
						children: "尚未分配任务。"
					}),
					tasks.map((task) => (0, react_jsx_runtime.jsx)(TaskRecord, {
						task,
						team
					}, task.id)),
					(0, react_jsx_runtime.jsx)("p", {
						className: WorkflowWorkbench_module_css_default.hint,
						children: "结果和验证记录来自 Agent 提交；没有记录的内容会标明缺失，不视为已经验证。"
					})
				]
			});
		}
		//#endregion
		//#region lib/client/workflow-connections.js
		/** Mirrors graph invariants for immediate drag feedback; the server revalidates. */
		function connectionIssue(tasks, from, to) {
			const target = tasks.find((t) => t.id === to);
			if (!target || !tasks.some((t) => t.id === from)) return "节点不存在";
			if (from === to) return "不能连接自身";
			if (target.dependencies.includes(from)) return "这条交接已存在";
			if (target.status !== "pending" || (target.attempt ?? 0) > 0 || target.reassigning || target.checkpoint?.decision) return "请先停止目标任务，或创建返工轮次";
			const seen = /* @__PURE__ */ new Set();
			function reaches(id) {
				if (id === to) return true;
				if (seen.has(id)) return false;
				seen.add(id);
				return tasks.find((t) => t.id === id)?.dependencies.some(reaches) ?? false;
			}
			if (reaches(from)) return "这条连接会形成循环";
		}
		function connectionTarget(tasks, position, point, from) {
			return tasks.filter((t) => t.id !== from).map((task) => {
				const p = position(task.id), dx = point.x - p.x, dy = point.y - (p.y + 55);
				return {
					task,
					p,
					distance: Math.hypot(dx, dy),
					inside: point.x >= p.x - 18 && point.x <= p.x + 243 && point.y >= p.y - 12 && point.y <= p.y + 138
				};
			}).filter((candidate) => candidate.distance <= 40 || candidate.inside).sort((a, b) => a.distance - b.distance)[0]?.task;
		}
		//#endregion
		//#region lib/client/artwork.js
		function portrait(path, color = "#4c6b91", background = "#edf2f8") {
			return "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="1" y="1" width="46" height="46" rx="14" fill="${background}"/><g transform="translate(12 12)" fill="none" stroke="${color}" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${path}</g></svg>`);
		}
		const portraits = {
			member: portrait("<circle cx=\"12\" cy=\"8\" r=\"3.5\"/><path d=\"M5 21v-2a7 7 0 0 1 14 0v2\"/>"),
			research: portrait("<circle cx=\"10\" cy=\"10\" r=\"6\"/><path d=\"m14.5 14.5 6 6M7 10h6M10 7v6\"/>"),
			engineer: portrait("<path d=\"m7 6-5 6 5 6m10-12 5 6-5 6M14 3l-4 18\"/>"),
			qa: portrait("<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m7.5 12 3 3 6-6\"/>", "#42796b", "#edf5f1"),
			design: portrait("<path d=\"m5 15-1 5 5-1L20 8l-4-4L5 15Zm8-8 4 4M5 15l4 4\"/>", "#7b6595", "#f3eff7"),
			review: portrait("<path d=\"m12 2 8 3v6c0 5-4 8-8 11-4-3-8-6-8-11V5l8-3Z\"/><path d=\"m8 11 3 3 5-5\"/>", "#42796b", "#edf5f1"),
			docs: portrait("<path d=\"M6 2h8l5 5v15H6V2Zm8 0v6h5M9 12h7M9 16h7\"/>"),
			data: portrait("<path d=\"M4 21V11h4v10M10 21V4h4v17M16 21v-7h4v7\"/>", "#7b6595", "#f3eff7"),
			operator: portrait("<path d=\"M5 3v18M12 3v18M19 3v18\"/><rect x=\"2\" y=\"7\" width=\"6\" height=\"4\" rx=\"1\" fill=\"#edf2f8\"/><rect x=\"9\" y=\"14\" width=\"6\" height=\"4\" rx=\"1\" fill=\"#edf2f8\"/><rect x=\"16\" y=\"5\" width=\"6\" height=\"4\" rx=\"1\" fill=\"#edf2f8\"/>")
		};
		const LEAD_ART = portrait("<rect x=\"8\" y=\"2\" width=\"8\" height=\"6\" rx=\"2\"/><path d=\"M12 8v5M5 16v-3h14v3\"/><rect x=\"1\" y=\"16\" width=\"8\" height=\"6\" rx=\"2\"/><rect x=\"15\" y=\"16\" width=\"8\" height=\"6\" rx=\"2\"/>", "#376ac4", "#edf3ff");
		const REVIEW_ART = portraits.review;
		const ACTION_ART = {
			working: portrait("<path d=\"m13 2-8 12h6l-1 8 9-13h-7l1-7Z\"/>"),
			idle: portrait("<path d=\"M8 5v14M16 5v14\"/>"),
			unknown: portrait("<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 6v6l4 2\"/>")
		};
		const ROLE_ART = [
			[/secur|audit|review|验收|安全|审计|审查|评审/, "review"],
			[/\bqa\b|test|verif|quality|测试|质量|验证/, "qa"],
			[/design|\bui\b|\bux\b|front|设计|前端|无障碍/, "design"],
			[/data|analys|metric|performance|数据|分析|指标|性能/, "data"],
			[/resear|investig|explor|study|研究|调查|探索|调研/, "research"],
			[/engineer|develop|\bdev\b|server|backend|\bapi\b|工程|后端|服务|接口|开发|代码|编程/, "engineer"],
			[/docs|writer|product|spec|撰写|文案|写作|文档|规范|产品/, "docs"],
			[/release|\bbuild\b|deploy|\bops\b|\bci\b|coordin|发布|构建|部署|运维|协调/, "operator"]
		];
		/** Role takes precedence over display names; equal roles always share a portrait. */
		function memberArtUrl(name, role) {
			const identity = (role.trim() || name.trim()).toLowerCase();
			for (const [pattern, key] of ROLE_ART) if (pattern.test(identity)) return portraits[key];
			return portraits.member;
		}
		//#endregion
		//#region \0dsh-css:G:\dsh_agents\src\client\ActivityPanel.module.css.mjs
		const css$3 = "html{--agent-teams-panel-shift:420px}.H36AGW_workflowLaunchers{z-index:3;background:var(--dsw-alias-bg-layer-1,light-dark(#fff,#202226));position:sticky;top:0}html[data-agent-teams-panel-open] [data-phase=active]{box-sizing:border-box;padding-right:var(--agent-teams-panel-shift)}.H36AGW_badge{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 92%, transparent);backdrop-filter:blur(16px);height:34px;box-shadow:0 8px 28px color-mix(in srgb, var(--dsw-alias-bg-mask-3) 29%, transparent);color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;align-items:center;gap:7px;padding:0 12px;font-size:12px;font-weight:600;line-height:20px;transition:border-color .15s,transform .12s;display:inline-flex;position:absolute;top:64px;right:18px}.H36AGW_badge:hover{border-color:var(--dsw-alias-border-l3);transform:translateY(-1px)}.H36AGW_badge:active{transform:translateY(0)scale(.98)}.H36AGW_badge:focus-visible,.H36AGW_iconButton:focus-visible,.H36AGW_memberRow:focus-visible,.H36AGW_membersToggle:focus-visible,.H36AGW_sectionToggleTitle:focus-visible,.H36AGW_dagNode:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.H36AGW_badgeDot,.H36AGW_panelDot{background:var(--dsw-alias-label-tertiary);border-radius:50%;width:7px;height:7px}.H36AGW_badgeDot[data-busy=true],.H36AGW_panelDot[data-busy=true]{background:var(--dsw-alias-state-business-primary);animation:1.25s ease-in-out infinite H36AGW_agentTeamsPulse}.H36AGW_badgeCount,.H36AGW_memberCount,.H36AGW_teamStats,.H36AGW_stageLabel,.H36AGW_taskId{font-variant-numeric:tabular-nums}.H36AGW_panel{box-sizing:border-box;border:1px solid color-mix(in srgb, var(--dsw-alias-border-l3) 58%, transparent);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 95%, transparent);backdrop-filter:blur(20px)saturate(1.08);box-shadow:0 12px 32px color-mix(in srgb, var(--dsw-alias-bg-mask-3) 25%, transparent), 0 32px 72px color-mix(in srgb, var(--dsw-alias-bg-mask-3) 33%, transparent);will-change:transform;border-radius:16px;flex-direction:column;animation:.16s ease-out H36AGW_agentTeamsPanelIn;display:flex;position:absolute;top:0;left:0;overflow:hidden}.H36AGW_panel[data-dragging],.H36AGW_panel[data-resizing]{user-select:none;box-shadow:0 16px 38px color-mix(in srgb, var(--dsw-alias-bg-mask-3) 29%, transparent), 0 36px 78px color-mix(in srgb, var(--dsw-alias-bg-mask-3) 38%, transparent)}@keyframes H36AGW_agentTeamsPanelIn{0%{opacity:0}to{opacity:1}}@keyframes H36AGW_agentTeamsPulse{0%,to{opacity:.42}50%{opacity:1}}.H36AGW_panelHead{border-bottom:1px solid var(--dsw-alias-border-l2);cursor:grab;touch-action:none;flex:none;justify-content:space-between;align-items:center;min-height:44px;padding:0 14px 0 16px;display:flex}.H36AGW_panelHead:active,.H36AGW_panel[data-dragging] .H36AGW_panelHead{cursor:grabbing}.H36AGW_panel[data-compact] .H36AGW_panelHead{cursor:default;touch-action:auto}.H36AGW_panelTitle{color:var(--dsw-alias-label-primary);align-items:center;gap:8px;font-size:14px;font-weight:600;line-height:20px;display:inline-flex}.H36AGW_panelControls{flex:none;align-items:center;gap:2px;display:inline-flex}.H36AGW_iconButton{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-radius:7px;justify-content:center;align-items:center;padding:0;transition:background-color .12s,color .12s,transform .12s;display:inline-flex}.H36AGW_iconButton:hover{background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-primary)}.H36AGW_iconButton:active{transform:scale(.94)}.H36AGW_iconButton[data-control=dock][data-mode=docked] svg{transform:scaleX(-1)}.H36AGW_resizeHandle{z-index:5;touch-action:none;pointer-events:auto;position:absolute}.H36AGW_resizeHandle[data-resize-edge=left]{cursor:ew-resize;width:14px;top:44px;bottom:14px;left:0}.H36AGW_resizeHandle[data-resize-edge=left]:after{background:color-mix(in srgb, var(--dsw-alias-label-tertiary) 42%, transparent);content:\"\";opacity:.45;border-radius:999px;width:3px;height:48px;transition:background-color .12s,opacity .12s;position:absolute;top:50%;left:4px;transform:translateY(-50%)}.H36AGW_resizeHandle[data-resize-edge=bottom]{cursor:ns-resize;height:14px;bottom:0;left:20px;right:20px}.H36AGW_resizeHandle[data-resize-edge=bottom]:after{background:color-mix(in srgb, var(--dsw-alias-label-tertiary) 42%, transparent);content:\"\";opacity:.45;border-radius:999px;width:48px;height:3px;transition:background-color .12s,opacity .12s;position:absolute;bottom:4px;left:50%;transform:translate(-50%)}.H36AGW_resizeHandle[data-resize-edge=corner]{cursor:nwse-resize;width:28px;height:28px;bottom:0;right:0}.H36AGW_resizeHandle[data-resize-edge=corner]:after{border-right:2px solid var(--dsw-alias-label-tertiary);border-bottom:2px solid var(--dsw-alias-label-tertiary);content:\"\";opacity:.58;width:10px;height:10px;transition:border-color .12s,opacity .12s;position:absolute;bottom:6px;right:6px}.H36AGW_resizeHandle:hover:after,.H36AGW_panel[data-resizing] .H36AGW_resizeHandle:after{background-color:var(--dsw-alias-state-business-primary);border-color:var(--dsw-alias-state-business-primary);opacity:.95}.H36AGW_teams{overscroll-behavior:contain;scrollbar-color:color-mix(in srgb, var(--dsw-alias-label-tertiary) 28%, transparent) transparent;scrollbar-width:thin;flex-direction:column;min-height:0;display:flex;overflow-y:auto}.H36AGW_teams::-webkit-scrollbar{width:6px}.H36AGW_teams::-webkit-scrollbar-track{background:0 0}.H36AGW_teams::-webkit-scrollbar-thumb{background:color-mix(in srgb, var(--dsw-alias-label-tertiary) 28%, transparent);background-clip:padding-box;border:2px solid #0000;border-radius:999px}.H36AGW_teams:hover::-webkit-scrollbar-thumb{background:color-mix(in srgb, var(--dsw-alias-label-tertiary) 44%, transparent);background-clip:padding-box}.H36AGW_team{border-bottom:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:12px;padding:12px 14px 16px;display:flex;container:H36AGW_agent-team/inline-size}.H36AGW_team:last-child{border-bottom:0}.H36AGW_teamHead{align-items:center;gap:10px;min-width:0;display:flex}.H36AGW_teamName{min-width:0;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:13px;font-weight:600;line-height:18px;overflow:hidden}.H36AGW_teamStats{color:var(--dsw-alias-label-tertiary);white-space:nowrap;flex:none;gap:8px;font-size:10.5px;line-height:16px;display:inline-flex}.H36AGW_teamStopButton{border:1px solid var(--dsw-alias-border-l2);width:26px;height:26px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border-radius:7px;flex:none;place-items:center;padding:0;transition:border-color .15s,background .15s,color .15s;display:grid}.H36AGW_teamStopButton:hover{border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 42%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 7%, transparent);color:var(--dsw-alias-state-error-primary)}.H36AGW_teamStopButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.H36AGW_stopModalActions{justify-content:flex-end;gap:8px;display:flex}.H36AGW_stopModalActions button{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-ghost-active-fill);min-height:34px;color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;border-radius:8px;justify-content:center;align-items:center;gap:6px;padding:6px 13px;font-size:12px;font-weight:600;display:inline-flex}.H36AGW_stopModalActions button[data-danger]{border-color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-label-primary-inverted)}.H36AGW_stopModalActions button:disabled{cursor:wait;opacity:.58}.H36AGW_stopModalError{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent);color:var(--dsw-alias-state-error-primary);border-radius:8px;align-items:flex-start;gap:7px;margin:0;padding:9px 10px;font-size:12px;line-height:18px;display:flex}.H36AGW_stopModalError svg{flex:none;margin-top:1px}.H36AGW_sectionHead{justify-content:space-between;align-items:center;gap:8px;min-width:0;display:flex}.H36AGW_sectionTitle{color:var(--dsw-alias-label-secondary);align-items:center;gap:6px;font-size:11px;font-weight:600;line-height:16px;display:inline-flex}.H36AGW_sectionHint{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:14px;overflow:hidden}.H36AGW_delegationSection{min-width:0}.H36AGW_captainNode{box-sizing:border-box;border:1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 32%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 7%, var(--dsw-alias-bg-layer-1));border-radius:10px;grid-template-columns:48px minmax(0,1fr) auto;align-items:center;gap:9px;min-height:56px;padding:6px 10px;display:grid}.H36AGW_captainAvatar,.H36AGW_memberAvatar{flex:none;justify-content:center;align-items:center;display:inline-flex;position:relative}.H36AGW_captainAvatar{width:46px;height:46px}.H36AGW_leadAvatar,.H36AGW_memberArt{object-fit:contain;filter:none;background:0 0;border:0;border-radius:0}.H36AGW_leadAvatar{width:44px;height:44px}.H36AGW_memberArt{width:40px;height:40px}.H36AGW_captainInfo,.H36AGW_memberInfo{flex-direction:column;min-width:0;display:flex}.H36AGW_captainInfo{gap:2px}.H36AGW_captainLine,.H36AGW_memberLine{align-items:center;gap:6px;min-width:0;display:flex}.H36AGW_captainName,.H36AGW_memberName{color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;font-weight:600;line-height:18px;overflow:hidden}.H36AGW_captainRole,.H36AGW_memberRole{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:14px;overflow:hidden}.H36AGW_captainSummary,.H36AGW_memberStatusLine{color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;font-size:10.5px;line-height:15px;overflow:hidden}.H36AGW_taskDetailModel{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9.5px;line-height:14px;overflow:hidden}.H36AGW_memberModel{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-ghost-active-fill);min-width:0;max-width:132px;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;border-radius:999px;flex:0 auto;align-items:center;padding:0 6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9px;font-weight:600;line-height:15px;display:inline-flex;overflow:hidden}.H36AGW_captainState,.H36AGW_memberState{color:var(--dsw-alias-label-tertiary);white-space:nowrap;flex:none;align-items:center;gap:5px;font-size:10px;font-weight:500;line-height:15px;display:inline-flex}.H36AGW_captainState[data-busy=true],.H36AGW_memberState[data-activity=working]{color:var(--dsw-alias-state-business-primary)}.H36AGW_workGlyph rect{opacity:.5}.H36AGW_workGlyph[data-active=true] rect{animation:1.1s ease-in-out infinite H36AGW_agentTeamsDot}@keyframes H36AGW_agentTeamsDot{0%,to{opacity:.25}50%{opacity:1}}.H36AGW_progressOverview{flex-direction:column;gap:7px;display:flex}.H36AGW_progressTitle{color:var(--dsw-alias-label-secondary);font-size:11px;font-weight:600;line-height:16px}.H36AGW_progressSegments{gap:3px;display:flex}.H36AGW_progressSegments>span,.H36AGW_progressEmpty{background:var(--dsw-alias-border-l3);border-radius:2px;flex:1;height:5px}.H36AGW_progressEmpty{width:100%;display:block}.H36AGW_progressSegments>span[data-state=running]{background:var(--dsw-alias-state-business-primary)}.H36AGW_progressSegments>span[data-state=blocked]{background:var(--dsw-alias-state-warn-primary)}.H36AGW_progressSegments>span[data-state=completed]{background:var(--dsw-alias-state-success-primary)}.H36AGW_progressSegments>span[data-state=failed]{background:var(--dsw-alias-state-error-primary)}.H36AGW_progressSegments>span[data-state=cancelled]{opacity:.55}.H36AGW_progressLegend{color:var(--dsw-alias-label-tertiary);flex-wrap:wrap;gap:10px;font-size:9.5px;line-height:14px;display:flex}.H36AGW_progressLegend>span[data-state=running]{color:var(--dsw-alias-state-business-primary)}.H36AGW_progressLegend>span[data-state=blocked]{color:var(--dsw-alias-state-warn-primary)}.H36AGW_progressLegend>span[data-state=completed]{color:var(--dsw-alias-state-success-primary)}.H36AGW_progressSummary{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 7%, var(--dsw-alias-bg-layer-1));min-width:0;color:var(--dsw-alias-label-secondary);border-radius:8px;align-items:center;gap:6px;padding:5px 8px;font-size:10px;font-weight:600;line-height:15px;display:flex}.H36AGW_progressSummary[data-state=warning]{background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 8%, var(--dsw-alias-bg-layer-1))}.H36AGW_progressSummary[data-state=completed]{background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 8%, var(--dsw-alias-bg-layer-1))}.H36AGW_progressSummary[data-state=discarded]{background:var(--dsw-alias-button-ghost-active-fill)}.H36AGW_progressSummary>span:last-child{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.H36AGW_progressSummaryDot{background:var(--dsw-alias-state-business-primary);border-radius:50%;flex:none;width:5px;height:5px}.H36AGW_progressSummary[data-state=warning] .H36AGW_progressSummaryDot{background:var(--dsw-alias-state-warn-primary)}.H36AGW_progressSummary[data-state=completed] .H36AGW_progressSummaryDot{background:var(--dsw-alias-state-success-primary)}.H36AGW_progressSummary[data-state=discarded] .H36AGW_progressSummaryDot{background:var(--dsw-alias-label-tertiary)}.H36AGW_membersToggle{background:var(--dsw-alias-bg-module-platform);width:100%;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border:0;border-radius:8px;justify-content:space-between;align-items:center;gap:8px;padding:6px 8px;font-size:10.5px;font-weight:600;line-height:15px;display:flex}.H36AGW_membersToggle:hover{background:var(--dsw-alias-button-ghost-active-fill)}.H36AGW_membersToggle>span{align-items:center;gap:5px;display:inline-flex}.H36AGW_membersToggle>span:last-child{color:var(--dsw-alias-state-business-primary)}.H36AGW_chevron{flex:none;transition:transform .14s}.H36AGW_chevron[data-open=true]{transform:rotate(90deg)}.H36AGW_delegationTree{flex-direction:column;gap:2px;margin-left:18px;padding:9px 0 0 20px;display:flex;position:relative}.H36AGW_delegationTree:before{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 48%, var(--dsw-alias-border-l2));content:\"\";width:1px;position:absolute;top:0;bottom:22px;left:0}.H36AGW_memberBlock{flex-direction:column;min-width:0;padding:3px 0 7px;display:flex;position:relative}.H36AGW_memberBranch{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 48%, var(--dsw-alias-border-l2));width:20px;height:1px;display:block;position:absolute;top:27px;right:100%}.H36AGW_memberBranch:before{background:var(--dsw-alias-state-business-primary);content:\"\";border-radius:50%;width:5px;height:5px;position:absolute;top:-2px;right:-1px}.H36AGW_memberRow{box-sizing:border-box;width:100%;min-width:0;min-height:48px;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:8px;grid-template-columns:46px minmax(0,1fr) auto;align-items:center;gap:8px;padding:4px 6px;transition:background-color .12s,transform .12s;display:grid}.H36AGW_memberRow:hover,.H36AGW_memberRow[data-activity=working]{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 6%, var(--dsw-alias-bg-layer-1))}.H36AGW_memberRow:active{transform:scale(.995)}.H36AGW_memberAvatar{width:42px;height:42px}.H36AGW_memberAvatar[data-unread=true]:after{box-sizing:border-box;border:1px solid var(--dsw-alias-bg-layer-1);background:var(--dsw-alias-state-business-primary);content:\"\";border-radius:50%;width:6px;height:6px;animation:1.8s ease-in-out infinite H36AGW_agentTeamsUnreadPulse;position:absolute;top:0;right:-1px}@keyframes H36AGW_agentTeamsUnreadPulse{0%,to{opacity:.78;transform:scale(.92)}50%{opacity:1;transform:scale(1.16)}}.H36AGW_memberInitial{background:var(--dsw-alias-state-business-primary);width:34px;height:34px;color:var(--dsw-alias-label-primary-inverted);border-radius:50%;justify-content:center;align-items:center;font-size:14px;font-weight:600;line-height:20px;display:inline-flex}.H36AGW_stateArt{box-sizing:border-box;object-fit:contain;width:22px;height:22px;filter:drop-shadow(0 0 1px var(--dsw-alias-bg-layer-1)) drop-shadow(0 1px 1px #122d483d);background:0 0;border:0;border-radius:0;position:absolute;bottom:-3px;right:-5px}.H36AGW_stateArt[data-activity=working]{animation:2.4s ease-in-out infinite H36AGW_agentTeamsFloat}.H36AGW_stateArt[data-activity=idle]{animation:4.2s ease-in-out infinite H36AGW_agentTeamsBreathe}.H36AGW_stateArt[data-activity=unknown]{animation:2.8s ease-in-out infinite H36AGW_agentTeamsThink}@keyframes H36AGW_agentTeamsFloat{0%,to{transform:translateY(0)rotate(-4deg)}50%{transform:translateY(-2px)rotate(4deg)}}@keyframes H36AGW_agentTeamsBreathe{0%,to{opacity:.82;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}@keyframes H36AGW_agentTeamsThink{0%,to{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}.H36AGW_memberState{margin-left:auto}.H36AGW_memberCount{color:var(--dsw-alias-label-tertiary);font-size:10.5px;line-height:16px}.H36AGW_assignmentLine{align-items:center;gap:7px;min-width:0;padding:0 6px 0 60px;display:flex}.H36AGW_assignmentLabel{color:var(--dsw-alias-label-tertiary);flex:none;font-size:9.5px;line-height:14px}.H36AGW_assignmentTasks{flex-wrap:wrap;flex:1;gap:4px;min-width:0;display:flex}.H36AGW_assignmentChip{background:var(--dsw-alias-button-ghost-active-fill);max-width:100%;min-height:16px;color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;border-radius:4px;align-items:center;padding:0 5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9px;font-weight:600;line-height:14px;display:inline-flex;overflow:hidden}.H36AGW_assignmentChip[data-state=running]{background:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary-inverted)}.H36AGW_assignmentChip[data-state=completed]{background:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-label-primary-inverted)}.H36AGW_assignmentChip[data-state=blocked]{background:var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-label-primary-inverted)}.H36AGW_assignmentChip[data-state=failed]{background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-label-primary-inverted)}.H36AGW_assignmentChip[data-state=cancelled]{color:var(--dsw-alias-label-tertiary);text-decoration:line-through}.H36AGW_unreadPill{color:var(--dsw-alias-state-business-primary);white-space:nowrap;flex:none;font-size:9.5px;font-weight:600;line-height:14px}.H36AGW_taskEmpty{color:var(--dsw-alias-label-tertiary);font-size:9.5px;line-height:14px}.H36AGW_dependencySection{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:7px;min-width:0;padding-top:10px;display:flex}.H36AGW_sectionToggleTitle{color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;background:0 0;border:0;align-items:center;gap:6px;padding:0;font-size:11px;font-weight:600;line-height:16px;display:inline-flex}.H36AGW_dagViewport{scrollbar-width:thin;min-width:0;padding:2px 0 4px;overflow-x:auto}.H36AGW_dagCanvas{min-width:100%;position:relative}.H36AGW_dagCanvas[data-layout=parallel]{flex-wrap:wrap;gap:8px;display:flex}.H36AGW_dagCanvas[data-layout=parallel] .H36AGW_dagNode{flex:92px;min-width:92px;position:relative}.H36AGW_dagEdges{pointer-events:none;position:absolute;inset:0;overflow:visible}.H36AGW_dagEdges path{fill:none;stroke:var(--dsw-alias-border-l3);stroke-width:1px;transition:opacity .14s,stroke .14s,stroke-width .14s}.H36AGW_dagEdges path[data-active=true]{stroke:var(--dsw-alias-state-business-primary);stroke-width:1.6px}.H36AGW_dagEdges path[data-dimmed=true]{opacity:.24}.H36AGW_dagNode{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;text-align:left;cursor:pointer;border-radius:6px;flex-direction:column;justify-content:center;gap:1px;padding:0 6px;transition:border-color .14s,background-color .14s,opacity .14s;display:flex;position:absolute}.H36AGW_dagNode:hover,.H36AGW_dagNode[data-focused=true]{border-color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 6%, var(--dsw-alias-bg-layer-1))}.H36AGW_dagNode[data-dimmed=true]{opacity:.3}.H36AGW_dagNode[data-state=running][data-dimmed=true]{opacity:.58}.H36AGW_dagNode[data-state=completed]{border-color:color-mix(in srgb, var(--dsw-alias-state-success-primary) 48%, var(--dsw-alias-border-l2))}.H36AGW_dagNode[data-state=blocked]{border-color:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 52%, var(--dsw-alias-border-l2))}.H36AGW_dagNode[data-state=failed]{border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 56%, var(--dsw-alias-border-l2))}.H36AGW_dagNode[data-verdict-stale=true]{border-style:dashed;border-color:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 62%, var(--dsw-alias-border-l2))}.H36AGW_dagNode[data-verdict-stale=true] .H36AGW_dagNodeHead{color:var(--dsw-alias-state-warn-primary)}.H36AGW_dagNodeHead{color:var(--dsw-alias-label-primary);align-items:center;gap:4px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9.5px;font-weight:700;display:flex}.H36AGW_dagNodeDot{background:var(--dsw-alias-border-l3);border-radius:1.5px;flex:none;width:5px;height:5px}.H36AGW_dagNode[data-state=running] .H36AGW_dagNodeDot{background:var(--dsw-alias-state-business-primary)}.H36AGW_dagNode[data-state=running] .H36AGW_dagNodeHead{padding-right:12px}.H36AGW_dagRunningState{width:9px;height:9px;color:var(--dsw-alias-state-business-primary);pointer-events:none;justify-content:center;align-items:center;display:inline-flex;position:absolute;top:4px;right:5px}.H36AGW_dagRunningState .H36AGW_workGlyph{width:9px;height:9px}.H36AGW_dagNode[data-state=blocked] .H36AGW_dagNodeDot{background:var(--dsw-alias-state-warn-primary)}.H36AGW_dagNode[data-state=completed] .H36AGW_dagNodeDot{background:var(--dsw-alias-state-success-primary)}.H36AGW_dagNode[data-state=failed] .H36AGW_dagNodeDot{background:var(--dsw-alias-state-error-primary)}.H36AGW_dagNodeLabel{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:8.5px;line-height:11px;overflow:hidden}.H36AGW_taskDetail{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);border-radius:9px;flex-direction:column;gap:3px;min-width:0;padding:7px 9px;display:flex}.H36AGW_taskDetailHead{align-items:center;gap:6px;min-width:0;display:flex}.H36AGW_taskDetailId{color:var(--dsw-alias-state-business-primary);flex:none;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;font-weight:700}.H36AGW_taskDetailSubject{min-width:0;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:600;line-height:16px;overflow:hidden}.H36AGW_taskDetailBadge{background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-secondary);border-radius:4px;flex:none;padding:0 5px;font-size:8.5px;font-weight:600;line-height:14px}.H36AGW_taskDetailBadge[data-state=running]{background:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary-inverted)}.H36AGW_taskDetailBadge[data-state=blocked]{background:var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-label-primary-inverted)}.H36AGW_taskDetailBadge[data-state=completed]{background:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-label-primary-inverted)}.H36AGW_taskDetailBadge[data-state=failed]{background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-label-primary-inverted)}.H36AGW_taskDetailLine,.H36AGW_taskDetailMeta{color:var(--dsw-alias-label-secondary);font-size:9.5px;line-height:14px}.H36AGW_taskDetailMeta{color:var(--dsw-alias-label-tertiary)}.H36AGW_emptyHint{color:var(--dsw-alias-label-tertiary);padding:10px 12px;font-size:11px;line-height:16px}.H36AGW_planEditor{border:1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 30%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 94%, var(--dsw-alias-state-business-primary));box-shadow:inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);border-radius:10px;flex-direction:column;gap:12px;margin:0 10px 12px;padding:12px;display:flex}.H36AGW_planHeader>span{justify-content:space-between;align-items:center;gap:8px;display:flex}.H36AGW_planHeader>span>span{flex-direction:column;gap:2px;min-width:0;display:flex}.H36AGW_planHeader strong{color:var(--dsw-alias-label-primary);font-size:12px}.H36AGW_planHeader small{color:var(--dsw-alias-label-secondary);font-size:9px;font-weight:500;line-height:13px}.H36AGW_planHeader em{background:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary-inverted);border-radius:999px;flex:none;padding:1px 7px;font-size:9px;font-style:normal;line-height:16px}.H36AGW_planHeader p{color:var(--dsw-alias-label-secondary);margin:5px 0 0;font-size:10px;line-height:15px}.H36AGW_planFlow{grid-template-columns:repeat(3,minmax(0,1fr));margin:0;padding:0;list-style:none;display:grid}.H36AGW_planFlow li{min-width:0;color:var(--dsw-alias-label-tertiary);align-items:center;gap:5px;font-size:9px;font-weight:600;line-height:14px;display:flex;position:relative}.H36AGW_planFlow li:not(:last-child):after{background:var(--dsw-alias-border-l2);content:\"\";flex:1;min-width:8px;height:1px;margin-right:5px}.H36AGW_planFlow li>span{border:1px solid var(--dsw-alias-border-l2);border-radius:50%;flex:none;place-items:center;width:18px;height:18px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9px;display:grid}.H36AGW_planFlow li[data-active]{color:var(--dsw-alias-state-business-primary)}.H36AGW_planFlow li[data-active]>span{border-color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent)}.H36AGW_planSection{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);border-radius:8px;overflow:hidden}.H36AGW_planSectionToggle,.H36AGW_planCardHeader{box-sizing:border-box;width:100%;color:var(--dsw-alias-label-primary);cursor:pointer;text-align:left;background:0 0;border:0}.H36AGW_planSectionToggle{justify-content:space-between;align-items:center;gap:8px;min-height:42px;padding:7px 9px;display:flex}.H36AGW_planSectionToggle:hover,.H36AGW_planCardHeader:hover{background:color-mix(in srgb, var(--dsw-alias-button-ghost-active-fill) 46%, transparent)}.H36AGW_planSectionToggle>span{align-items:baseline;gap:7px;min-width:0;display:flex}.H36AGW_planSectionToggle strong{font-size:10.5px}.H36AGW_planSectionToggle small{color:var(--dsw-alias-label-tertiary);font-size:9px}.H36AGW_planList{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:0;display:flex}.H36AGW_planEmpty{color:var(--dsw-alias-label-tertiary);text-align:center;margin:0;padding:12px;font-size:10px}.H36AGW_planCard{background:0 0;border:0;border-radius:0;min-width:0;margin:0;padding:0;display:block;position:relative}.H36AGW_planCard+.H36AGW_planCard{border-top:1px solid var(--dsw-alias-border-l2)}.H36AGW_planCard[data-open=true]{background:color-mix(in srgb, var(--dsw-alias-bg-base) 62%, transparent)}.H36AGW_planCardHeader{grid-template-columns:minmax(80px,.9fr) minmax(72px,1.15fr) auto 12px;align-items:center;gap:7px;min-height:40px;padding:6px 9px;display:grid}.H36AGW_planCardIdentity{flex-direction:column;gap:1px;min-width:0;display:flex}.H36AGW_planCardIdentity strong,.H36AGW_planTaskSummary{color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;font-size:10px;font-weight:650;line-height:14px;overflow:hidden}.H36AGW_planCardIdentity>span,.H36AGW_planCardMeta{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:8.5px;line-height:12px;overflow:hidden}.H36AGW_planTaskId{background:var(--dsw-alias-button-ghost-active-fill);width:max-content;color:var(--dsw-alias-label-secondary);border-radius:4px;padding:1px 5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:8.5px;font-weight:700;line-height:14px}.H36AGW_planDirty{background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 13%, transparent);color:var(--dsw-alias-state-warn-primary);border-radius:999px;justify-self:end;padding:1px 5px;font-size:8px;font-style:normal;font-weight:650;line-height:14px}.H36AGW_planChevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .18s cubic-bezier(.2,.7,.2,1)}.H36AGW_planChevron[data-open=true]{transform:rotate(90deg)}.H36AGW_planCardBody{flex-direction:column;gap:8px;padding:0 9px 9px;display:flex}.H36AGW_planCardBody fieldset{border:0;flex-direction:column;gap:7px;min-width:0;margin:0;padding:0;display:flex}.H36AGW_planCardBody label,.H36AGW_planNewTask label{min-width:0;color:var(--dsw-alias-label-tertiary);flex-direction:column;flex:1;gap:4px;font-size:9px;display:flex}.H36AGW_planCardBody label small{color:var(--dsw-alias-label-tertiary);font-size:8px;line-height:11px}.H36AGW_planCard input,.H36AGW_planCard textarea,.H36AGW_planCard select,.H36AGW_planNewTask input{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);width:100%;min-width:0;color:var(--dsw-alias-label-primary);font:inherit;border-radius:6px;outline:none;font-size:10.5px;line-height:16px;transition:border-color .16s,box-shadow .16s}.H36AGW_planCard input,.H36AGW_planCard select,.H36AGW_planNewTask input{min-height:32px;padding:6px 8px}.H36AGW_planCard textarea{resize:vertical;min-height:58px;padding:7px 8px}.H36AGW_planCard input:focus-visible,.H36AGW_planCard textarea:focus-visible,.H36AGW_planCard select:focus-visible,.H36AGW_planNewTask input:focus-visible{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent)}.H36AGW_planGrid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:6px;display:grid}.H36AGW_planModelPicker{grid-template-columns:minmax(0,1fr);gap:5px;display:grid}.H36AGW_planModelMenu{width:100%;display:flex}.H36AGW_planModelTrigger{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);width:100%;min-height:38px;color:var(--dsw-alias-label-primary);cursor:pointer;text-align:left;border-radius:7px;justify-content:space-between;align-items:center;gap:8px;padding:7px 9px;transition:border-color .16s,background-color .16s,transform .12s;display:flex}.H36AGW_planModelTrigger:hover:not(:disabled){border-color:var(--dsw-alias-border-l3);background:var(--dsw-alias-interactive-bg-hover)}.H36AGW_planModelTrigger:active:not(:disabled){transform:translateY(1px)}.H36AGW_planModelTrigger:focus-visible{border-color:var(--dsw-alias-state-business-primary);outline:2px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent);outline-offset:1px}.H36AGW_planModelTrigger:disabled{cursor:wait;opacity:.64}.H36AGW_planModelTriggerCopy{align-items:baseline;gap:6px;min-width:0;display:flex}.H36AGW_planModelTriggerCopy strong,.H36AGW_planModelTriggerCopy span{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.H36AGW_planModelTriggerCopy strong{color:var(--dsw-alias-label-primary);font-size:10px;font-weight:650;line-height:15px}.H36AGW_planModelTriggerCopy span{color:var(--dsw-alias-label-tertiary);font-size:9px;line-height:14px}.H36AGW_planModelMenuRow{grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:8px;width:100%;min-width:0;display:grid}.H36AGW_planModelMenuRow>span:first-child{color:var(--dsw-alias-label-primary)}.H36AGW_planModelMenuRow strong{color:var(--dsw-alias-label-tertiary);text-align:right;text-overflow:ellipsis;white-space:nowrap;font-weight:450;overflow:hidden}.H36AGW_planModelMenuBack{align-items:center;gap:7px;display:inline-flex}.H36AGW_planModelMenuBack svg{transform:rotate(180deg)}.H36AGW_planModelEffortRow{flex-direction:column;align-items:flex-start;min-width:0;display:flex}.H36AGW_planModelEffortRow small{width:100%;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:14px;overflow:hidden}.H36AGW_planModelHint{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:8.5px;line-height:12px;overflow:hidden}.H36AGW_planModelNotice{background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 9%, transparent);color:var(--dsw-alias-label-secondary);border-radius:6px;grid-column:1/-1;justify-content:space-between;align-items:center;gap:8px;padding:6px 7px;font-size:8.5px;line-height:12px;display:flex}.H36AGW_planModelNotice button{color:var(--dsw-alias-state-business-primary);cursor:pointer;font:inherit;background:0 0;border:0;flex:none;padding:2px 6px;font-weight:650}.H36AGW_planActions,.H36AGW_planApproveRow,.H36AGW_planNewTask,.H36AGW_planConfirm,.H36AGW_planApproveActions,.H36AGW_planSecondaryActions{align-items:center;gap:7px;display:flex}.H36AGW_planReviewActions{grid-template-columns:minmax(0,1fr);gap:6px;width:100%;display:grid}.H36AGW_planSecondaryActions{grid-template-columns:minmax(0,1fr) auto;display:grid}.H36AGW_planActions{justify-content:flex-end}.H36AGW_planActions button,.H36AGW_planNewTask button,.H36AGW_planApproveRow button,.H36AGW_planConfirm button{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-ghost-active-fill);min-height:30px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:6px;flex:none;padding:5px 10px;font-size:9.5px;font-weight:600;transition:background .16s,border-color .16s,transform .16s}.H36AGW_planActions button:hover:not(:disabled),.H36AGW_planNewTask button:hover:not(:disabled),.H36AGW_planApproveRow button:hover:not(:disabled),.H36AGW_planConfirm button:hover:not(:disabled){border-color:var(--dsw-alias-label-tertiary)}.H36AGW_planActions button:active:not(:disabled),.H36AGW_planNewTask button:active:not(:disabled),.H36AGW_planApproveRow button:active:not(:disabled),.H36AGW_planConfirm button:active:not(:disabled){transform:scale(.98)}.H36AGW_planActions button[data-danger],.H36AGW_planConfirm button[data-danger]{color:var(--dsw-alias-state-error-primary)}.H36AGW_planFeedback{min-width:0;color:var(--dsw-alias-label-secondary);flex:1;align-items:center;gap:5px;font-size:9px;line-height:13px;animation:.18s ease-out H36AGW_plan-feedback-in;display:inline-flex}.H36AGW_planFeedback[data-tone=success]{color:var(--dsw-alias-state-success-primary)}.H36AGW_planFeedback[data-tone=error]{color:var(--dsw-alias-state-error-primary)}.H36AGW_planFeedback>span{border:1px solid;border-radius:50%;flex:none;place-items:center;width:15px;height:15px;display:grid}.H36AGW_planFeedback svg{width:11px;height:11px}@keyframes H36AGW_plan-feedback-in{0%{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:translateY(0)}}.H36AGW_planConfirm{border:1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 30%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 7%, transparent);border-radius:7px;flex-wrap:wrap;justify-content:flex-end;padding:7px}.H36AGW_planConfirm>span{min-width:140px;color:var(--dsw-alias-label-secondary);flex:1;font-size:9px;line-height:13px}.H36AGW_planNewTask{align-items:flex-end}.H36AGW_planNewTask label{gap:4px}.H36AGW_planNewTask label>span{line-height:13px}.H36AGW_planApproveRow{z-index:1;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 94%, transparent);min-height:50px;box-shadow:0 -5px 16px color-mix(in srgb, var(--dsw-alias-bg-base) 35%, transparent);backdrop-filter:blur(8px);border-radius:8px;flex-direction:column;justify-content:flex-end;align-items:stretch;margin:0 -4px -4px;padding:8px;position:sticky;bottom:0}.H36AGW_planApproveRow[data-armed=true]{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 45%, var(--dsw-alias-border-l2))}.H36AGW_planApproveRow[data-discard=true]{border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, var(--dsw-alias-border-l2))}.H36AGW_planApproveCopy{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.H36AGW_planApproveCopy strong{color:var(--dsw-alias-label-primary);font-size:9.5px;line-height:13px}.H36AGW_planApproveCopy small{color:var(--dsw-alias-label-tertiary);font-size:8.5px;line-height:12px}.H36AGW_planApproveRow button{background:var(--dsw-alias-state-business-primary);min-height:32px;color:var(--dsw-alias-label-primary-inverted);padding-inline:13px}.H36AGW_planReviewActions>button[data-plan-approve]{width:100%}.H36AGW_planApproveActions>button:first-child{background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-primary)}.H36AGW_planSecondaryActions>button,.H36AGW_planApproveActions>button[data-danger]{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-primary)}.H36AGW_planSecondaryActions>button[data-danger],.H36AGW_planApproveActions>button[data-danger]{color:var(--dsw-alias-state-error-primary)}.H36AGW_planSectionToggle:focus-visible,.H36AGW_planCardHeader:focus-visible,.H36AGW_planActions button:focus-visible,.H36AGW_planNewTask button:focus-visible,.H36AGW_planApproveRow button:focus-visible,.H36AGW_planConfirm button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}.H36AGW_planActions button:disabled,.H36AGW_planNewTask button:disabled,.H36AGW_planApproveRow button:disabled{cursor:default;opacity:.55}.H36AGW_historicPill{background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-tertiary);border-radius:4px;flex:none;margin-left:auto;padding:1px 7px;font-size:9.5px;font-weight:600;line-height:15px}.H36AGW_members{flex-direction:column;gap:3px;display:flex}.H36AGW_archiveLabel{color:var(--dsw-alias-label-tertiary);padding:5px 14px 0;font-size:9.5px;font-weight:600;line-height:14px;display:block}@media (prefers-reduced-motion:reduce){.H36AGW_panel,.H36AGW_badge,.H36AGW_badgeDot,.H36AGW_panelDot,.H36AGW_workGlyph rect,.H36AGW_stateArt,.H36AGW_memberAvatar[data-unread=true]:after,.H36AGW_planChevron,.H36AGW_planFeedback,.H36AGW_planActions button,.H36AGW_planNewTask button,.H36AGW_planApproveRow button,.H36AGW_planConfirm button,.H36AGW_planCard input,.H36AGW_planCard textarea,.H36AGW_planCard select,.H36AGW_planNewTask input{transition:none;animation:none}}@media (width<=960px){html[data-agent-teams-panel-open] [data-phase=active]{padding-right:0}}@media (width<=640px){.H36AGW_badge{top:56px;right:10px}.H36AGW_teamStats span[data-stat=messages]{display:none}.H36AGW_captainNode{grid-template-columns:48px minmax(0,1fr)}.H36AGW_captainState{display:none}.H36AGW_delegationTree{margin-left:12px;padding-left:15px}.H36AGW_memberBranch{width:15px}.H36AGW_assignmentLine{padding-left:53px}.H36AGW_planFlow li{gap:4px;font-size:8px}.H36AGW_planFlow li:not(:last-child):after{margin-right:3px}.H36AGW_planCardHeader{grid-template-columns:auto minmax(0,1fr) auto}.H36AGW_planCardHeader .H36AGW_planCardMeta{display:none}.H36AGW_planGrid,.H36AGW_planModelPicker{grid-template-columns:minmax(0,1fr)}.H36AGW_planNewTask,.H36AGW_planApproveRow{flex-direction:column;align-items:stretch}.H36AGW_planNewTask button,.H36AGW_planApproveRow>button,.H36AGW_planApproveActions,.H36AGW_planReviewActions{width:100%}.H36AGW_planApproveActions button,.H36AGW_planReviewActions button,.H36AGW_planSecondaryActions button{flex:1}}@container H36AGW_agent-team (width<=360px){.H36AGW_planEditor{margin-inline:0;padding-inline:10px}.H36AGW_planHeader>span{align-items:flex-start}.H36AGW_planFlow li{gap:3px;font-size:7.5px}.H36AGW_planFlow li:not(:last-child):after{min-width:4px;margin-right:2px}.H36AGW_planSecondaryActions,.H36AGW_planApproveActions{grid-template-columns:minmax(0,1fr);width:100%;display:grid}.H36AGW_planSecondaryActions button,.H36AGW_planApproveActions button{width:100%}}.H36AGW_dagOwner{text-overflow:ellipsis;max-width:64px;margin-left:auto;font-size:9px;font-weight:400;overflow:hidden}.H36AGW_team[data-workspace-team]{--workspace-surface:var(--dsw-alias-bg-layer-1);--workspace-line:color-mix(in srgb, var(--dsw-alias-border-l2) 75%, transparent);--workspace-shadow:0 3px 14px color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent);background:0 0;border:0;gap:14px;padding:0;container:none}.H36AGW_team[data-workspace-team] .H36AGW_teamHead{flex-wrap:wrap;gap:8px;padding:0 2px 2px}.H36AGW_team[data-workspace-team] .H36AGW_teamName{flex-basis:160px;font-size:14px;line-height:1.5}.H36AGW_team[data-workspace-team] .H36AGW_teamStats{flex-wrap:wrap;font-size:11px}.H36AGW_team[data-workspace-team] .H36AGW_teamStopButton{border-radius:9px;width:32px;height:32px}.H36AGW_team[data-workspace-team] .H36AGW_delegationSection,.H36AGW_team[data-workspace-team] .H36AGW_dependencySection,.H36AGW_completionCard,.H36AGW_inboxCard{border:1px solid var(--workspace-line);background:var(--workspace-surface);min-width:0;box-shadow:var(--workspace-shadow);box-sizing:border-box;border-radius:18px;margin:0;padding:18px}.H36AGW_team[data-workspace-team] .H36AGW_captainNode{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 4%, var(--dsw-alias-bg-module-platform));border-color:var(--workspace-line);border-radius:12px;grid-template-columns:44px minmax(0,1fr);gap:8px;padding:10px}.H36AGW_team[data-workspace-team] .H36AGW_captainState{grid-column:2;justify-self:start;font-size:11px}.H36AGW_team[data-workspace-team] .H36AGW_captainName{font-size:14px}.H36AGW_team[data-workspace-team] .H36AGW_captainRole{font-size:11px}.H36AGW_team[data-workspace-team] .H36AGW_captainSummary{white-space:normal;font-size:12px;line-height:1.6}.H36AGW_team[data-workspace-team] .H36AGW_progressOverview{gap:9px;margin:16px 0}.H36AGW_team[data-workspace-team] .H36AGW_progressSegments{gap:4px}.H36AGW_team[data-workspace-team] .H36AGW_progressSegments>span{border-radius:4px;height:6px}.H36AGW_team[data-workspace-team] .H36AGW_progressLegend{gap:8px 12px;font-size:11px}.H36AGW_team[data-workspace-team] .H36AGW_progressSummary{font-size:11px;line-height:1.6}.H36AGW_team[data-workspace-team] .H36AGW_progressSummary>span:last-child{white-space:normal}.H36AGW_team[data-workspace-team] .H36AGW_membersToggle{background:var(--dsw-alias-bg-module-platform);border-radius:9px;padding:10px;font-size:11px}.H36AGW_team[data-workspace-team] .H36AGW_memberBlock{padding-top:14px;padding-bottom:8px}.H36AGW_team[data-workspace-team] .H36AGW_memberRow{border-radius:9px}.H36AGW_team[data-workspace-team] .H36AGW_memberLine{flex-wrap:wrap;gap:4px 6px}.H36AGW_team[data-workspace-team] .H36AGW_memberName{font-size:13px}.H36AGW_team[data-workspace-team] .H36AGW_memberRole,.H36AGW_team[data-workspace-team] .H36AGW_memberState,.H36AGW_team[data-workspace-team] .H36AGW_memberCount{font-size:11px}.H36AGW_team[data-workspace-team] .H36AGW_memberRole{background:var(--dsw-alias-bg-module-platform);border-radius:5px;padding:1px 5px}.H36AGW_team[data-workspace-team] .H36AGW_memberStatusLine{white-space:normal;font-size:12px;line-height:1.6}.H36AGW_team[data-workspace-team] .H36AGW_assignmentLine{flex-wrap:wrap;row-gap:5px}.H36AGW_team[data-workspace-team] .H36AGW_assignmentLabel{font-size:10px}.H36AGW_team[data-workspace-team] .H36AGW_assignmentChip{border-radius:5px;font-size:10px;line-height:18px}.H36AGW_team[data-workspace-team] .H36AGW_memberBlock[data-selected-member] .H36AGW_memberRow{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:3px}.H36AGW_team[data-workspace-team] .H36AGW_sectionHead{flex-wrap:wrap;gap:8px;margin-bottom:18px}.H36AGW_team[data-workspace-team] .H36AGW_sectionToggleTitle{font-size:12px}.H36AGW_team[data-workspace-team] .H36AGW_sectionHint{white-space:normal;font-size:11px;line-height:1.6}.H36AGW_team[data-workspace-team] .H36AGW_dagViewport{padding:4px 2px 14px}.H36AGW_team[data-workspace-team] .H36AGW_dagNode{background:var(--workspace-surface);border-radius:11px;padding:10px 11px}.H36AGW_team[data-workspace-team] .H36AGW_dagNodeHead{margin-bottom:6px;font-size:11px}.H36AGW_team[data-workspace-team] .H36AGW_dagNodeLabel{white-space:normal;-webkit-line-clamp:2;letter-spacing:0;-webkit-box-orient:vertical;font-size:12px;line-height:1.4;display:-webkit-box;overflow:hidden}.H36AGW_team[data-workspace-team] .H36AGW_dagOwner{white-space:nowrap;max-width:105px;font-size:10px}.H36AGW_team[data-workspace-team] .H36AGW_taskDetail{border-radius:11px;margin-top:14px;padding:14px}.H36AGW_team[data-workspace-team] .H36AGW_taskDetailSubject{white-space:normal;font-size:13px;line-height:1.6}.H36AGW_team[data-workspace-team] .H36AGW_taskDetailLine,.H36AGW_team[data-workspace-team] .H36AGW_taskDetailMeta{font-size:12px;line-height:1.6}.H36AGW_team[data-workspace-team] .H36AGW_planEditor{background:var(--workspace-surface);border-color:var(--workspace-line);border-radius:18px;margin:0;padding:18px}.H36AGW_team[data-workspace-team] .H36AGW_planApproveRow{position:static}.H36AGW_workspaceSummary{grid-template-columns:minmax(0,1fr);gap:14px;min-width:0;display:grid}.H36AGW_completionCard h3,.H36AGW_inboxCard h3{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;font-weight:600;line-height:1.6}.H36AGW_completionBody{flex-wrap:wrap;align-items:center;gap:20px;margin-top:16px;display:flex}.H36AGW_completionRing{flex:none;width:132px;height:132px;position:relative}.H36AGW_completionRing svg{width:100%;height:100%;transform:rotate(-90deg)}.H36AGW_completionRing circle{fill:none;stroke-width:7px}.H36AGW_ringTrack{stroke:var(--dsw-alias-border-l2)}.H36AGW_ringValue{stroke:var(--dsw-alias-state-business-primary)}.H36AGW_completionRing>span{color:var(--dsw-alias-label-secondary);flex-direction:column;justify-content:center;align-items:center;gap:5px;font-size:11px;display:flex;position:absolute;inset:0}.H36AGW_completionRing strong{color:var(--dsw-alias-label-primary);letter-spacing:-.7px;font-variant-numeric:tabular-nums;font-size:26px;font-weight:600;line-height:1.2}.H36AGW_completionRing small{font-size:18px;font-weight:450}.H36AGW_completionTasks{flex:200px;min-width:0;max-height:216px;margin:0;padding:2px;list-style:none;overflow:auto}.H36AGW_completionTasks li{border-bottom:1px solid var(--workspace-line);grid-template-columns:18px auto minmax(0,1fr) auto;align-items:center;gap:8px;padding:7px 0;font-size:11px;display:grid}.H36AGW_completionTasks li:last-child{border:0}.H36AGW_completionDot{background:var(--dsw-alias-bg-module-platform);width:16px;height:16px;color:var(--dsw-alias-label-secondary);border-radius:50%;place-items:center;display:grid}.H36AGW_completionTasks li[data-state=completed] .H36AGW_completionDot{background:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary-inverted)}.H36AGW_completionTasks li[data-state=failed] .H36AGW_completionDot{background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-label-primary-inverted)}.H36AGW_completionTaskId{text-overflow:ellipsis;white-space:nowrap;max-width:6em;color:var(--dsw-alias-label-secondary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;overflow:hidden}.H36AGW_completionTaskSubject{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.H36AGW_completionTaskStatus{color:var(--dsw-alias-label-secondary);font-size:10px}.H36AGW_completionTasks li[data-verdict-stale] .H36AGW_completionDot{background:var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-label-primary)}.H36AGW_completionTasks li[data-verdict-stale] .H36AGW_completionTaskStatus{font-weight:600}.H36AGW_completionTasks:focus-visible,.H36AGW_inboxMessages:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:3px;border-radius:4px}.H36AGW_inboxCard>header{flex-wrap:wrap;align-items:baseline;gap:6px 12px;display:flex}.H36AGW_inboxCard>header>span{color:var(--dsw-alias-label-secondary);font-size:10px}.H36AGW_inboxMessages{max-height:260px;margin:14px 0 0;padding:0;list-style:none;overflow:auto}.H36AGW_inboxMessages li{align-items:start;gap:9px;margin:0 0 12px;display:flex}.H36AGW_inboxMessages img,.H36AGW_inboxInitial{object-fit:contain;flex:none;width:30px;height:30px}.H36AGW_inboxInitial{background:var(--dsw-alias-bg-module-platform);border-radius:9px;place-items:center;font-size:12px;display:grid}.H36AGW_inboxMessages li>div{flex:1;min-width:0}.H36AGW_inboxMessages strong{overflow-wrap:anywhere;font-size:11px;font-weight:550}.H36AGW_inboxMessages p{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 6%, var(--dsw-alias-bg-module-platform));white-space:pre-wrap;overflow-wrap:anywhere;border-radius:0 10px 10px;margin:5px 0 0;padding:9px 11px;font-size:12px;line-height:1.6}.H36AGW_summaryEmpty{color:var(--dsw-alias-label-secondary);margin:14px 0 0;font-size:12px;line-height:1.8}@container (width>=800px){.H36AGW_team[data-workspace-team]{grid-template-columns:minmax(280px,.8fr) minmax(0,1.4fr);align-items:start;gap:16px;display:grid}.H36AGW_team[data-workspace-team]>.H36AGW_teamHead,.H36AGW_team[data-workspace-team]>[data-staging-editor],.H36AGW_workspaceSummary{grid-column:1/-1}.H36AGW_workspaceSummary{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px}.H36AGW_team[data-workspace-team] .H36AGW_dependencySection{align-self:stretch}.H36AGW_team[data-workspace-team] .H36AGW_dagCanvas[data-layout=parallel]{grid-template-columns:repeat(2,minmax(0,1fr))}}@container (width<=400px){.H36AGW_team[data-workspace-team] .H36AGW_delegationSection,.H36AGW_team[data-workspace-team] .H36AGW_dependencySection,.H36AGW_completionCard,.H36AGW_inboxCard{border-radius:14px;padding:12px}.H36AGW_team[data-workspace-team] .H36AGW_teamStats{gap:6px;font-size:10px}.H36AGW_completionBody{justify-content:center}}.H36AGW_progressSegments>span[data-state=claimed],.H36AGW_dagNode[data-state=claimed] .H36AGW_dagNodeDot{background:var(--dsw-alias-state-warn-primary)}.H36AGW_progressLegend>span[data-state=claimed]{color:var(--dsw-alias-state-warn-primary)}.H36AGW_dagNode[data-state=claimed]{border-color:var(--dsw-alias-state-warn-primary)}.H36AGW_dagNode[data-state=claimed] .H36AGW_dagNodeHead{padding-right:38px}.H36AGW_dagClaimedState{color:var(--dsw-alias-state-warn-primary);font-size:8px;line-height:10px;position:absolute;top:4px;right:5px}.H36AGW_assignmentChip[data-state=claimed],.H36AGW_taskDetailBadge[data-state=claimed]{background:var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-label-primary-inverted)}.H36AGW_quickMember{border:1px solid var(--dsw-alias-border-l2,#dce1e8);border-radius:8px;gap:8px;margin:8px 0 8px 38px;padding:10px;font-size:12px;display:grid}.H36AGW_quickMember label{gap:4px;display:grid}.H36AGW_quickMember textarea{box-sizing:border-box;resize:vertical;width:100%;min-height:55px;font:inherit;color:inherit;border:1px solid var(--dsw-alias-border-l2,#dce1e8);background:0 0;border-radius:6px;padding:6px}.H36AGW_quickMember>div:last-child{gap:6px;display:flex}.H36AGW_quickMember>div:last-child button,.H36AGW_quickTranscript{font:inherit;border:1px solid var(--dsw-alias-border-l2,#dce1e8);color:inherit;cursor:pointer;background:0 0;border-radius:6px;padding:4px 8px}.H36AGW_quickMember p[role=alert]{color:var(--dsw-alias-state-error-primary,#b94444);overflow-wrap:anywhere}.H36AGW_quickTranscript{margin:4px 0 4px 38px;font-size:11px;display:block}.H36AGW_memberBlock[data-selected-member] .H36AGW_memberRow{outline:2px solid var(--dsw-alias-state-business-primary,#2866d7);outline-offset:2px}";
		const tagId$3 = "@yogurtss/dsh-teamflow/ActivityPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@yogurtss/dsh-teamflow";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var ActivityPanel_module_css_default = {
			"agent-team": "H36AGW_agent-team",
			"agentTeamsBreathe": "H36AGW_agentTeamsBreathe",
			"agentTeamsDot": "H36AGW_agentTeamsDot",
			"agentTeamsFloat": "H36AGW_agentTeamsFloat",
			"agentTeamsPanelIn": "H36AGW_agentTeamsPanelIn",
			"agentTeamsPulse": "H36AGW_agentTeamsPulse",
			"agentTeamsThink": "H36AGW_agentTeamsThink",
			"agentTeamsUnreadPulse": "H36AGW_agentTeamsUnreadPulse",
			"archiveLabel": "H36AGW_archiveLabel",
			"assignmentChip": "H36AGW_assignmentChip",
			"assignmentLabel": "H36AGW_assignmentLabel",
			"assignmentLine": "H36AGW_assignmentLine",
			"assignmentTasks": "H36AGW_assignmentTasks",
			"badge": "H36AGW_badge",
			"badgeCount": "H36AGW_badgeCount",
			"badgeDot": "H36AGW_badgeDot",
			"captainAvatar": "H36AGW_captainAvatar",
			"captainInfo": "H36AGW_captainInfo",
			"captainLine": "H36AGW_captainLine",
			"captainName": "H36AGW_captainName",
			"captainNode": "H36AGW_captainNode",
			"captainRole": "H36AGW_captainRole",
			"captainState": "H36AGW_captainState",
			"captainSummary": "H36AGW_captainSummary",
			"chevron": "H36AGW_chevron",
			"completionBody": "H36AGW_completionBody",
			"completionCard": "H36AGW_completionCard",
			"completionDot": "H36AGW_completionDot",
			"completionRing": "H36AGW_completionRing",
			"completionTaskId": "H36AGW_completionTaskId",
			"completionTaskStatus": "H36AGW_completionTaskStatus",
			"completionTaskSubject": "H36AGW_completionTaskSubject",
			"completionTasks": "H36AGW_completionTasks",
			"dagCanvas": "H36AGW_dagCanvas",
			"dagClaimedState": "H36AGW_dagClaimedState",
			"dagEdges": "H36AGW_dagEdges",
			"dagNode": "H36AGW_dagNode",
			"dagNodeDot": "H36AGW_dagNodeDot",
			"dagNodeHead": "H36AGW_dagNodeHead",
			"dagNodeLabel": "H36AGW_dagNodeLabel",
			"dagOwner": "H36AGW_dagOwner",
			"dagRunningState": "H36AGW_dagRunningState",
			"dagViewport": "H36AGW_dagViewport",
			"delegationSection": "H36AGW_delegationSection",
			"delegationTree": "H36AGW_delegationTree",
			"dependencySection": "H36AGW_dependencySection",
			"emptyHint": "H36AGW_emptyHint",
			"historicPill": "H36AGW_historicPill",
			"iconButton": "H36AGW_iconButton",
			"inboxCard": "H36AGW_inboxCard",
			"inboxInitial": "H36AGW_inboxInitial",
			"inboxMessages": "H36AGW_inboxMessages",
			"leadAvatar": "H36AGW_leadAvatar",
			"memberArt": "H36AGW_memberArt",
			"memberAvatar": "H36AGW_memberAvatar",
			"memberBlock": "H36AGW_memberBlock",
			"memberBranch": "H36AGW_memberBranch",
			"memberCount": "H36AGW_memberCount",
			"memberInfo": "H36AGW_memberInfo",
			"memberInitial": "H36AGW_memberInitial",
			"memberLine": "H36AGW_memberLine",
			"memberModel": "H36AGW_memberModel",
			"memberName": "H36AGW_memberName",
			"memberRole": "H36AGW_memberRole",
			"memberRow": "H36AGW_memberRow",
			"memberState": "H36AGW_memberState",
			"memberStatusLine": "H36AGW_memberStatusLine",
			"members": "H36AGW_members",
			"membersToggle": "H36AGW_membersToggle",
			"panel": "H36AGW_panel",
			"panelControls": "H36AGW_panelControls",
			"panelDot": "H36AGW_panelDot",
			"panelHead": "H36AGW_panelHead",
			"panelTitle": "H36AGW_panelTitle",
			"plan-feedback-in": "H36AGW_plan-feedback-in",
			"planActions": "H36AGW_planActions",
			"planApproveActions": "H36AGW_planApproveActions",
			"planApproveCopy": "H36AGW_planApproveCopy",
			"planApproveRow": "H36AGW_planApproveRow",
			"planCard": "H36AGW_planCard",
			"planCardBody": "H36AGW_planCardBody",
			"planCardHeader": "H36AGW_planCardHeader",
			"planCardIdentity": "H36AGW_planCardIdentity",
			"planCardMeta": "H36AGW_planCardMeta",
			"planChevron": "H36AGW_planChevron",
			"planConfirm": "H36AGW_planConfirm",
			"planDirty": "H36AGW_planDirty",
			"planEditor": "H36AGW_planEditor",
			"planEmpty": "H36AGW_planEmpty",
			"planFeedback": "H36AGW_planFeedback",
			"planFlow": "H36AGW_planFlow",
			"planGrid": "H36AGW_planGrid",
			"planHeader": "H36AGW_planHeader",
			"planList": "H36AGW_planList",
			"planModelEffortRow": "H36AGW_planModelEffortRow",
			"planModelHint": "H36AGW_planModelHint",
			"planModelMenu": "H36AGW_planModelMenu",
			"planModelMenuBack": "H36AGW_planModelMenuBack",
			"planModelMenuRow": "H36AGW_planModelMenuRow",
			"planModelNotice": "H36AGW_planModelNotice",
			"planModelPicker": "H36AGW_planModelPicker",
			"planModelTrigger": "H36AGW_planModelTrigger",
			"planModelTriggerCopy": "H36AGW_planModelTriggerCopy",
			"planNewTask": "H36AGW_planNewTask",
			"planReviewActions": "H36AGW_planReviewActions",
			"planSecondaryActions": "H36AGW_planSecondaryActions",
			"planSection": "H36AGW_planSection",
			"planSectionToggle": "H36AGW_planSectionToggle",
			"planTaskId": "H36AGW_planTaskId",
			"planTaskSummary": "H36AGW_planTaskSummary",
			"progressEmpty": "H36AGW_progressEmpty",
			"progressLegend": "H36AGW_progressLegend",
			"progressOverview": "H36AGW_progressOverview",
			"progressSegments": "H36AGW_progressSegments",
			"progressSummary": "H36AGW_progressSummary",
			"progressSummaryDot": "H36AGW_progressSummaryDot",
			"progressTitle": "H36AGW_progressTitle",
			"quickMember": "H36AGW_quickMember",
			"quickTranscript": "H36AGW_quickTranscript",
			"resizeHandle": "H36AGW_resizeHandle",
			"ringTrack": "H36AGW_ringTrack",
			"ringValue": "H36AGW_ringValue",
			"sectionHead": "H36AGW_sectionHead",
			"sectionHint": "H36AGW_sectionHint",
			"sectionTitle": "H36AGW_sectionTitle",
			"sectionToggleTitle": "H36AGW_sectionToggleTitle",
			"stageLabel": "H36AGW_stageLabel",
			"stateArt": "H36AGW_stateArt",
			"stopModalActions": "H36AGW_stopModalActions",
			"stopModalError": "H36AGW_stopModalError",
			"summaryEmpty": "H36AGW_summaryEmpty",
			"taskDetail": "H36AGW_taskDetail",
			"taskDetailBadge": "H36AGW_taskDetailBadge",
			"taskDetailHead": "H36AGW_taskDetailHead",
			"taskDetailId": "H36AGW_taskDetailId",
			"taskDetailLine": "H36AGW_taskDetailLine",
			"taskDetailMeta": "H36AGW_taskDetailMeta",
			"taskDetailModel": "H36AGW_taskDetailModel",
			"taskDetailSubject": "H36AGW_taskDetailSubject",
			"taskEmpty": "H36AGW_taskEmpty",
			"taskId": "H36AGW_taskId",
			"team": "H36AGW_team",
			"teamHead": "H36AGW_teamHead",
			"teamName": "H36AGW_teamName",
			"teamStats": "H36AGW_teamStats",
			"teamStopButton": "H36AGW_teamStopButton",
			"teams": "H36AGW_teams",
			"unreadPill": "H36AGW_unreadPill",
			"workGlyph": "H36AGW_workGlyph",
			"workflowLaunchers": "H36AGW_workflowLaunchers",
			"workspaceSummary": "H36AGW_workspaceSummary"
		};
		//#endregion
		//#region lib/client/StagingPlanEditor.js
		/**
		* Editable pre-run roster and DAG review for staged AgentTeams plans.
		*
		* This leaf owns only transient form/disclosure state. Durable truth remains
		* on the host and returns through the ordinary activity polling snapshot.
		* @module dsh-agent-teams/client/staging-plan
		*/
		const PLAN_URL = "/plugins/dsh-agent-teams/plan";
		function useDismissSuccess(feedback, setFeedback) {
			(0, react.useEffect)(() => {
				if (feedback?.tone !== "success") return;
				const timeout = window.setTimeout(() => {
					setFeedback(void 0);
				}, 3500);
				return () => {
					window.clearTimeout(timeout);
				};
			}, [feedback, setFeedback]);
		}
		async function mutatePlan(payload) {
			const response = await fetch(PLAN_URL, {
				method: "POST",
				cache: "no-store",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(payload)
			});
			if (response.ok) return;
			let message = `HTTP ${response.status}`;
			try {
				const body = await response.json();
				if (typeof body.error === "string" && body.error.trim() !== "") message = body.error;
			} catch {}
			throw new Error(message);
		}
		function errorMessage(error) {
			return error instanceof Error ? error.message : String(error);
		}
		function DisclosureChevron({ open }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				className: ActivityPanel_module_css_default.planChevron,
				"data-open": open,
				width: "12",
				height: "12",
				viewBox: "0 0 12 12",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				strokeLinecap: "round",
				"aria-hidden": true,
				children: (0, react_jsx_runtime.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5" })
			});
		}
		function Feedback({ value }) {
			if (value === void 0) return null;
			return (0, react_jsx_runtime.jsxs)("span", {
				className: ActivityPanel_module_css_default.planFeedback,
				"data-tone": value.tone,
				role: value.tone === "error" ? "alert" : "status",
				"aria-live": value.tone === "error" ? "assertive" : "polite",
				children: [(0, react_jsx_runtime.jsx)("span", {
					"aria-hidden": true,
					children: value.tone === "success" ? (0, react_jsx_runtime.jsx)("svg", {
						viewBox: "0 0 12 12",
						fill: "none",
						stroke: "currentColor",
						strokeWidth: "1.8",
						children: (0, react_jsx_runtime.jsx)("path", { d: "m2.5 6.2 2.2 2.2 4.8-5" })
					}) : (0, react_jsx_runtime.jsx)("svg", {
						viewBox: "0 0 12 12",
						fill: "none",
						stroke: "currentColor",
						strokeWidth: "1.8",
						children: (0, react_jsx_runtime.jsx)("path", { d: "M6 2.3v4.1M6 8.8v.1" })
					})
				}), value.message]
			});
		}
		function routeKey(provider, model) {
			return JSON.stringify([provider, model]);
		}
		const MODEL_MENU_OPEN_MODELS = "open:models";
		const MODEL_MENU_OPEN_EFFORT = "open:effort";
		const MODEL_MENU_BACK = "navigate:back";
		const MODEL_MENU_RETRY = "action:retry";
		const MODEL_MENU_DEFAULT_EFFORT = "effort:default";
		function modelMenuId(provider, model) {
			return `model:${routeKey(provider, model)}`;
		}
		function effortMenuId(effort) {
			return `effort:${effort}`;
		}
		/**
		* Thin staged-plan adapter over the official model directory. It deliberately
		* reads only catalog metadata: choosing a member route must not change the
		* captain session's composer model.
		*/
		function StagedModelPicker({ directory, provider, model, reasoningEffort, busy, onChange, t }) {
			const state = (0, react.useSyncExternalStore)(directory.store.subscribe, directory.store.getSnapshot);
			const [open, setOpen] = (0, react.useState)(false);
			const [pane, setPane] = (0, react.useState)("root");
			const catalogRoutes = state.groups.flatMap((group) => group.models.map((candidate) => ({
				key: routeKey(group.id, candidate.id),
				provider: group.id,
				providerName: group.name,
				model: candidate
			})));
			const selectedKey = routeKey(provider, model);
			const selected = catalogRoutes.find((candidate) => candidate.key === selectedKey);
			const efforts = selected?.model.reasoning?.efforts ?? [];
			const currentMissing = provider !== "" && model !== "" && selected === void 0;
			const defaultEffort = selected?.model.reasoning?.defaultEffort;
			const effectiveEffort = reasoningEffort === "" || reasoningEffort === "default" ? defaultEffort : reasoningEffort;
			const selectedEffort = efforts.find((effort) => effort.id === effectiveEffort);
			const modelLabel = selected?.model.name ?? (model === "" ? t("plan.model.choose") : model);
			const effortLabel = selectedEffort?.name ?? (effectiveEffort === void 0 ? t("plan.model.providerDefault") : effectiveEffort);
			const unavailable = state.status === "error" || state.failures.length > 0;
			const close = () => {
				setOpen(false);
				setPane("root");
			};
			const rootItems = [{
				id: MODEL_MENU_OPEN_MODELS,
				label: (0, react_jsx_runtime.jsxs)("span", {
					className: ActivityPanel_module_css_default.planModelMenuRow,
					children: [
						(0, react_jsx_runtime.jsx)("span", { children: t("plan.member.model") }),
						(0, react_jsx_runtime.jsx)("strong", { children: modelLabel }),
						(0, react_jsx_runtime.jsx)(DisclosureChevron, { open: false })
					]
				}),
				disabled: state.status === "loading" && catalogRoutes.length === 0
			}, {
				id: MODEL_MENU_OPEN_EFFORT,
				label: (0, react_jsx_runtime.jsxs)("span", {
					className: ActivityPanel_module_css_default.planModelMenuRow,
					children: [
						(0, react_jsx_runtime.jsx)("span", { children: t("plan.member.reasoning") }),
						(0, react_jsx_runtime.jsx)("strong", { children: effortLabel }),
						(0, react_jsx_runtime.jsx)(DisclosureChevron, { open: false })
					]
				}),
				disabled: selected?.model.reasoning === void 0
			}];
			const modelItems = [{
				id: MODEL_MENU_BACK,
				label: (0, react_jsx_runtime.jsxs)("span", {
					className: ActivityPanel_module_css_default.planModelMenuBack,
					children: [(0, react_jsx_runtime.jsx)(DisclosureChevron, { open: false }), t("plan.model.back")]
				})
			}, {
				type: "separator",
				id: "models:separator"
			}];
			if (catalogRoutes.length === 0) modelItems.push({
				id: "models:empty",
				label: state.status === "loading" ? t("plan.model.loading") : t("plan.model.empty"),
				disabled: true
			});
			else for (const group of state.groups) {
				modelItems.push({
					type: "label",
					id: `provider:${group.id}`,
					text: group.name
				});
				for (const candidate of group.models) modelItems.push({
					id: modelMenuId(group.id, candidate.id),
					label: candidate.name
				});
			}
			const effortItems = [
				{
					id: MODEL_MENU_BACK,
					label: (0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.planModelMenuBack,
						children: [(0, react_jsx_runtime.jsx)(DisclosureChevron, { open: false }), t("plan.model.back")]
					})
				},
				{
					type: "separator",
					id: "effort:separator"
				},
				{
					id: MODEL_MENU_DEFAULT_EFFORT,
					label: defaultEffort === void 0 ? t("plan.model.providerDefault") : t("plan.model.modelDefault", { effort: efforts.find((effort) => effort.id === defaultEffort)?.name ?? defaultEffort })
				},
				...efforts.map((effort) => ({
					id: effortMenuId(effort.id),
					label: (0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.planModelEffortRow,
						children: [(0, react_jsx_runtime.jsx)("span", { children: effort.name }), effort.description !== void 0 && (0, react_jsx_runtime.jsx)("small", { children: effort.description })]
					})
				}))
			];
			const items = pane === "models" ? modelItems : pane === "effort" ? effortItems : rootItems;
			const selectedId = pane === "models" ? modelMenuId(provider, model) : pane === "effort" ? reasoningEffort === "" || reasoningEffort === "default" ? MODEL_MENU_DEFAULT_EFFORT : effortMenuId(reasoningEffort) : void 0;
			const choose = (id) => {
				if (id === MODEL_MENU_OPEN_MODELS) {
					setPane("models");
					return;
				}
				if (id === MODEL_MENU_OPEN_EFFORT) {
					setPane("effort");
					return;
				}
				if (id === MODEL_MENU_BACK) {
					setPane("root");
					return;
				}
				if (id === MODEL_MENU_RETRY) {
					directory.load().catch(() => void 0);
					return;
				}
				const nextModel = catalogRoutes.find((candidate) => modelMenuId(candidate.provider, candidate.model.id) === id);
				if (nextModel !== void 0) {
					close();
					if (nextModel.provider === provider && nextModel.model.id === model) return;
					onChange({
						provider: nextModel.provider,
						model: nextModel.model.id,
						reasoningEffort: "default"
					});
					return;
				}
				if (id === MODEL_MENU_DEFAULT_EFFORT) {
					close();
					if (effectiveEffort === defaultEffort) return;
					onChange({
						provider,
						model,
						reasoningEffort: "default"
					});
					return;
				}
				const nextEffort = efforts.find((effort) => effortMenuId(effort.id) === id);
				if (nextEffort === void 0) return;
				close();
				if (nextEffort.id === reasoningEffort) return;
				onChange({
					provider,
					model,
					reasoningEffort: nextEffort.id
				});
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: ActivityPanel_module_css_default.planModelPicker,
				"data-model-directory-status": state.status,
				children: [
					(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
						open,
						portal: true,
						align: "end",
						compact: true,
						className: ActivityPanel_module_css_default.planModelMenu,
						items,
						footer: unavailable ? [{
							id: MODEL_MENU_RETRY,
							label: t("plan.model.retry")
						}] : void 0,
						selectedId,
						onSelect: choose,
						onClose: close,
						anchor: (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ActivityPanel_module_css_default.planModelTrigger,
							"data-plan-model-trigger": true,
							"aria-label": t("plan.model.triggerAria", {
								model: modelLabel,
								effort: effortLabel
							}),
							"aria-haspopup": "menu",
							"aria-expanded": open,
							disabled: busy,
							onClick: () => {
								if (open) close();
								else {
									setPane("root");
									setOpen(true);
									directory.load().catch(() => void 0);
								}
							},
							children: [(0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.planModelTriggerCopy,
								children: [(0, react_jsx_runtime.jsx)("strong", { children: state.status === "loading" && catalogRoutes.length === 0 ? t("plan.model.loading") : modelLabel }), (0, react_jsx_runtime.jsx)("span", { children: effortLabel })]
							}), (0, react_jsx_runtime.jsx)(DisclosureChevron, { open })]
						})
					}),
					(0, react_jsx_runtime.jsx)("small", {
						className: ActivityPanel_module_css_default.planModelHint,
						children: currentMissing ? t("plan.model.currentUnavailable", {
							provider,
							model
						}) : selected?.model.description ?? t("plan.model.route", {
							provider,
							model
						})
					}),
					unavailable && (0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.planModelNotice,
						role: state.status === "error" ? "alert" : "status",
						children: [(0, react_jsx_runtime.jsx)("span", { children: state.error ?? t("plan.model.partialFailure", { count: state.failures.length }) }), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: busy || state.status === "loading",
							onClick: () => {
								directory.load().catch(() => void 0);
							},
							children: t("plan.model.retry")
						})]
					})
				]
			});
		}
		function StagedMemberEditor({ team, member, modelDirectory, onPendingChange, t }) {
			const bodyId = (0, react.useId)();
			const [open, setOpen] = (0, react.useState)(false);
			const [role, setRole] = (0, react.useState)(member.role);
			const [provider, setProvider] = (0, react.useState)(member.provider ?? "");
			const [model, setModel] = (0, react.useState)(member.model ?? "");
			const [reasoningEffort, setReasoningEffort] = (0, react.useState)(member.reasoningEffort ?? "");
			const [executionPrompt, setExecutionPrompt] = (0, react.useState)(member.executionPrompt ?? "");
			const remoteSignature = JSON.stringify([
				member.role,
				member.provider ?? "",
				member.model ?? "",
				member.reasoningEffort ?? "",
				member.executionPrompt ?? ""
			]);
			const [savedSignature, setSavedSignature] = (0, react.useState)(remoteSignature);
			const [busy, setBusy] = (0, react.useState)(false);
			const [feedback, setFeedback] = (0, react.useState)();
			useDismissSuccess(feedback, setFeedback);
			const dirty = JSON.stringify([
				role,
				provider,
				model,
				reasoningEffort,
				executionPrompt
			]) !== savedSignature;
			(0, react.useEffect)(() => {
				onPendingChange(`member:${member.name}`, dirty || busy);
				return () => {
					onPendingChange(`member:${member.name}`, false);
				};
			}, [
				busy,
				dirty,
				member.name,
				onPendingChange
			]);
			(0, react.useEffect)(() => {
				setRole(member.role);
				setProvider(member.provider ?? "");
				setModel(member.model ?? "");
				setReasoningEffort(member.reasoningEffort ?? "");
				setExecutionPrompt(member.executionPrompt ?? "");
				setSavedSignature(remoteSignature);
			}, [
				member.role,
				member.provider,
				member.model,
				member.reasoningEffort,
				member.executionPrompt,
				remoteSignature
			]);
			const markEdited = () => {
				setFeedback(void 0);
			};
			const persist = async (selection = {
				provider,
				model,
				reasoningEffort
			}) => {
				const nextSignature = JSON.stringify([
					role,
					selection.provider,
					selection.model,
					selection.reasoningEffort,
					executionPrompt
				]);
				setProvider(selection.provider);
				setModel(selection.model);
				setReasoningEffort(selection.reasoningEffort);
				setBusy(true);
				setFeedback(void 0);
				try {
					await mutatePlan({
						sessionId: team.captainSessionId,
						teamId: team.teamId,
						action: "update_member",
						memberName: member.name,
						role,
						provider: selection.provider,
						model: selection.model,
						reasoningEffort: selection.reasoningEffort,
						executionPrompt
					});
					setSavedSignature(nextSignature);
					setFeedback({
						tone: "success",
						message: t("plan.saved")
					});
				} catch (error) {
					setFeedback({
						tone: "error",
						message: t("plan.failed", { message: errorMessage(error) })
					});
				} finally {
					setBusy(false);
				}
			};
			const save = async (event) => {
				event.preventDefault();
				await persist();
			};
			const route = `${provider}/${model}`.replace(/^\//u, "");
			return (0, react_jsx_runtime.jsxs)("article", {
				className: ActivityPanel_module_css_default.planCard,
				"data-plan-member": member.name,
				"data-open": open,
				children: [(0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: ActivityPanel_module_css_default.planCardHeader,
					"aria-expanded": open,
					"aria-controls": bodyId,
					onClick: () => {
						setOpen((current) => !current);
					},
					children: [
						(0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.planCardIdentity,
							children: [(0, react_jsx_runtime.jsx)("strong", { children: member.name }), (0, react_jsx_runtime.jsx)("span", { children: role || t("plan.member.roleFallback") })]
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.planCardMeta,
							title: route,
							children: route
						}),
						dirty && (0, react_jsx_runtime.jsx)("em", {
							className: ActivityPanel_module_css_default.planDirty,
							children: t("plan.unsaved")
						}),
						(0, react_jsx_runtime.jsx)(DisclosureChevron, { open })
					]
				}), open && (0, react_jsx_runtime.jsxs)("form", {
					id: bodyId,
					className: ActivityPanel_module_css_default.planCardBody,
					onSubmit: (event) => {
						save(event);
					},
					children: [(0, react_jsx_runtime.jsxs)("fieldset", {
						disabled: busy,
						children: [
							(0, react_jsx_runtime.jsxs)("label", { children: [t("plan.member.role"), (0, react_jsx_runtime.jsx)("input", {
								name: "role",
								value: role,
								onChange: (event) => {
									setRole(event.currentTarget.value);
									markEdited();
								}
							})] }),
							(0, react_jsx_runtime.jsx)(StagedModelPicker, {
								directory: modelDirectory,
								provider,
								model,
								reasoningEffort,
								busy,
								onChange: (selection) => {
									persist(selection);
								},
								t
							}),
							(0, react_jsx_runtime.jsxs)("label", { children: [t("plan.member.prompt"), (0, react_jsx_runtime.jsx)("textarea", {
								name: "executionPrompt",
								value: executionPrompt,
								onChange: (event) => {
									setExecutionPrompt(event.currentTarget.value);
									markEdited();
								},
								rows: 3
							})] })
						]
					}), (0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.planActions,
						children: [(0, react_jsx_runtime.jsx)(Feedback, { value: feedback }), (0, react_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: busy || !dirty || provider.trim() === "" || model.trim() === "",
							children: busy ? t("plan.saving") : t("plan.save")
						})]
					})]
				})]
			});
		}
		function StagedTaskEditor({ team, task, onPendingChange, t }) {
			const bodyId = (0, react.useId)();
			const taskDependencies = task.dependencies.join(", ");
			const [open, setOpen] = (0, react.useState)(false);
			const [subject, setSubject] = (0, react.useState)(task.subject);
			const [description, setDescription] = (0, react.useState)(task.description ?? "");
			const [assignee, setAssignee] = (0, react.useState)(task.assignee);
			const [dependencies, setDependencies] = (0, react.useState)(taskDependencies);
			const remoteSignature = JSON.stringify([
				task.subject,
				task.description ?? "",
				task.assignee,
				taskDependencies
			]);
			const [savedSignature, setSavedSignature] = (0, react.useState)(remoteSignature);
			const [busy, setBusy] = (0, react.useState)(false);
			const [confirmingRemove, setConfirmingRemove] = (0, react.useState)(false);
			const [feedback, setFeedback] = (0, react.useState)();
			useDismissSuccess(feedback, setFeedback);
			const signature = JSON.stringify([
				subject,
				description,
				assignee,
				dependencies
			]);
			const dirty = signature !== savedSignature;
			(0, react.useEffect)(() => {
				onPendingChange(`task:${task.id}`, dirty || busy);
				return () => {
					onPendingChange(`task:${task.id}`, false);
				};
			}, [
				busy,
				dirty,
				onPendingChange,
				task.id
			]);
			(0, react.useEffect)(() => {
				setSubject(task.subject);
				setDescription(task.description ?? "");
				setAssignee(task.assignee);
				setDependencies(taskDependencies);
				setSavedSignature(remoteSignature);
			}, [
				task.subject,
				task.description,
				task.assignee,
				taskDependencies,
				remoteSignature
			]);
			const markEdited = () => {
				setFeedback(void 0);
				setConfirmingRemove(false);
			};
			const save = async (event) => {
				event.preventDefault();
				setBusy(true);
				setFeedback(void 0);
				try {
					await mutatePlan({
						sessionId: team.captainSessionId,
						teamId: team.teamId,
						action: "update_task",
						taskId: task.id,
						subject,
						description,
						assignee,
						dependencies: dependencies.split(",").map((item) => item.trim()).filter(Boolean)
					});
					setSavedSignature(signature);
					setFeedback({
						tone: "success",
						message: t("plan.saved")
					});
				} catch (error) {
					setFeedback({
						tone: "error",
						message: t("plan.failed", { message: errorMessage(error) })
					});
				} finally {
					setBusy(false);
				}
			};
			const remove = async () => {
				setBusy(true);
				setFeedback(void 0);
				try {
					await mutatePlan({
						sessionId: team.captainSessionId,
						teamId: team.teamId,
						action: "remove_task",
						taskId: task.id
					});
					setFeedback({
						tone: "success",
						message: t("plan.removed")
					});
				} catch (error) {
					setFeedback({
						tone: "error",
						message: t("plan.failed", { message: errorMessage(error) })
					});
					setBusy(false);
				}
			};
			const dependencySummary = task.dependencies.length === 0 ? t("plan.dependencies.none") : t("plan.dependencies.count", { count: task.dependencies.length });
			return (0, react_jsx_runtime.jsxs)("article", {
				className: ActivityPanel_module_css_default.planCard,
				"data-plan-task": task.id,
				"data-open": open,
				children: [(0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: ActivityPanel_module_css_default.planCardHeader,
					"aria-expanded": open,
					"aria-controls": bodyId,
					onClick: () => {
						setOpen((current) => !current);
					},
					children: [
						(0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.planTaskId,
							children: task.id
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.planTaskSummary,
							title: subject,
							children: subject
						}),
						(0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.planCardMeta,
							children: [
								assignee || t("plan.task.unassigned"),
								" · ",
								dependencySummary
							]
						}),
						dirty && (0, react_jsx_runtime.jsx)("em", {
							className: ActivityPanel_module_css_default.planDirty,
							children: t("plan.unsaved")
						}),
						(0, react_jsx_runtime.jsx)(DisclosureChevron, { open })
					]
				}), open && (0, react_jsx_runtime.jsxs)("form", {
					id: bodyId,
					className: ActivityPanel_module_css_default.planCardBody,
					onSubmit: (event) => {
						save(event);
					},
					children: [
						(0, react_jsx_runtime.jsxs)("fieldset", {
							disabled: busy,
							children: [
								(0, react_jsx_runtime.jsxs)("label", { children: [t("plan.task.subject"), (0, react_jsx_runtime.jsx)("input", {
									name: "subject",
									required: true,
									value: subject,
									onChange: (event) => {
										setSubject(event.currentTarget.value);
										markEdited();
									}
								})] }),
								(0, react_jsx_runtime.jsxs)("label", { children: [t("plan.task.description"), (0, react_jsx_runtime.jsx)("textarea", {
									name: "description",
									value: description,
									onChange: (event) => {
										setDescription(event.currentTarget.value);
										markEdited();
									},
									rows: 3
								})] }),
								(0, react_jsx_runtime.jsxs)("span", {
									className: ActivityPanel_module_css_default.planGrid,
									children: [(0, react_jsx_runtime.jsxs)("label", { children: [t("plan.task.assignee"), (0, react_jsx_runtime.jsxs)("select", {
										name: "assignee",
										value: assignee,
										onChange: (event) => {
											setAssignee(event.currentTarget.value);
											markEdited();
										},
										children: [(0, react_jsx_runtime.jsx)("option", {
											value: "",
											children: t("plan.task.unassigned")
										}), team.members.map((member) => (0, react_jsx_runtime.jsx)("option", {
											value: member.name,
											children: member.name
										}, member.name))]
									})] }), (0, react_jsx_runtime.jsxs)("label", { children: [
										t("plan.task.dependencies"),
										(0, react_jsx_runtime.jsx)("input", {
											name: "dependencies",
											value: dependencies,
											onChange: (event) => {
												setDependencies(event.currentTarget.value);
												markEdited();
											}
										}),
										(0, react_jsx_runtime.jsx)("small", { children: t("plan.task.dependenciesHint") })
									] })]
								})
							]
						}),
						confirmingRemove && (0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.planConfirm,
							role: "alert",
							children: [
								(0, react_jsx_runtime.jsx)("span", { children: t("plan.removeWarning", { task: task.id }) }),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										setConfirmingRemove(false);
									},
									children: t("plan.cancel")
								}),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									"data-danger": true,
									"data-confirming": true,
									onClick: () => {
										remove();
									},
									children: t("plan.removeConfirm")
								})
							]
						}),
						(0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.planActions,
							children: [
								(0, react_jsx_runtime.jsx)(Feedback, { value: feedback }),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									"data-danger": true,
									onClick: () => {
										setConfirmingRemove(true);
										setFeedback(void 0);
									},
									disabled: busy || confirmingRemove,
									children: t("plan.remove")
								}),
								(0, react_jsx_runtime.jsx)("button", {
									type: "submit",
									disabled: busy || !dirty || subject.trim() === "",
									children: busy ? t("plan.saving") : t("plan.save")
								})
							]
						})
					]
				})]
			});
		}
		function StagingPlanEditor({ team, modelDirectory, onContinuePlanning, onDiscarded, t }) {
			const membersId = (0, react.useId)();
			const tasksId = (0, react.useId)();
			const [membersOpen, setMembersOpen] = (0, react.useState)(true);
			const [tasksOpen, setTasksOpen] = (0, react.useState)(true);
			const [newTask, setNewTask] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const [discardArmed, setDiscardArmed] = (0, react.useState)(false);
			const [pendingEditors, setPendingEditors] = (0, react.useState)(/* @__PURE__ */ new Set());
			const [feedback, setFeedback] = (0, react.useState)();
			useDismissSuccess(feedback, setFeedback);
			const dependencyLinks = team.tasks.reduce((total, task) => total + task.dependencies.length, 0);
			const runnable = team.members.length > 0 && team.tasks.length > 0;
			const hasPendingEdits = pendingEditors.size > 0 || newTask.trim() !== "";
			const waitingForFeedback = team.planReviewState === "awaiting_feedback";
			(0, react.useEffect)(() => {
				modelDirectory.load().catch(() => void 0);
			}, [modelDirectory]);
			const onPendingChange = (0, react.useCallback)((key, pending) => {
				setPendingEditors((current) => {
					if (pending === current.has(key)) return current;
					const next = new Set(current);
					if (pending) next.add(key);
					else next.delete(key);
					return next;
				});
			}, []);
			const addTask = async (event) => {
				event.preventDefault();
				setBusy(true);
				setFeedback(void 0);
				try {
					await mutatePlan({
						sessionId: team.captainSessionId,
						teamId: team.teamId,
						action: "add_task",
						subject: newTask,
						dependencies: []
					});
					setNewTask("");
					setFeedback({
						tone: "success",
						message: t("plan.taskAdded")
					});
					setTasksOpen(true);
				} catch (error) {
					setFeedback({
						tone: "error",
						message: t("plan.failed", { message: errorMessage(error) })
					});
				} finally {
					setBusy(false);
				}
			};
			const approve = async () => {
				setBusy(true);
				setFeedback(void 0);
				try {
					await mutatePlan({
						sessionId: team.captainSessionId,
						teamId: team.teamId,
						action: "approve"
					});
				} catch (error) {
					setFeedback({
						tone: "error",
						message: t("plan.failed", { message: errorMessage(error) })
					});
					setBusy(false);
				}
			};
			const continueInChat = async () => {
				if (waitingForFeedback) {
					onContinuePlanning();
					return;
				}
				setBusy(true);
				setFeedback(void 0);
				try {
					await mutatePlan({
						sessionId: team.captainSessionId,
						teamId: team.teamId,
						action: "continue"
					});
					onContinuePlanning();
				} catch (error) {
					setFeedback({
						tone: "error",
						message: t("plan.failed", { message: errorMessage(error) })
					});
					setBusy(false);
				}
			};
			const discard = async () => {
				setBusy(true);
				setFeedback(void 0);
				try {
					await mutatePlan({
						sessionId: team.captainSessionId,
						teamId: team.teamId,
						action: "discard"
					});
					onDiscarded();
				} catch (error) {
					setFeedback({
						tone: "error",
						message: t("plan.failed", { message: errorMessage(error) })
					});
					setBusy(false);
					setDiscardArmed(false);
				}
			};
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ActivityPanel_module_css_default.planEditor,
				"data-staging-editor": true,
				children: [
					(0, react_jsx_runtime.jsxs)("header", {
						className: ActivityPanel_module_css_default.planHeader,
						children: [(0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsx)("strong", { children: t("plan.title") }), (0, react_jsx_runtime.jsx)("small", { children: t("plan.readySummary", {
							members: team.members.length,
							tasks: team.tasks.length,
							links: dependencyLinks
						}) })] }), (0, react_jsx_runtime.jsx)("em", { children: t("plan.badge") })] }), (0, react_jsx_runtime.jsx)("p", { children: t("plan.description") })]
					}),
					(0, react_jsx_runtime.jsxs)("ol", {
						className: ActivityPanel_module_css_default.planFlow,
						"aria-label": t("plan.flow.aria"),
						children: [
							(0, react_jsx_runtime.jsxs)("li", {
								"data-active": true,
								children: [(0, react_jsx_runtime.jsx)("span", { children: "1" }), t("plan.flow.review")]
							}),
							(0, react_jsx_runtime.jsxs)("li", { children: [(0, react_jsx_runtime.jsx)("span", { children: "2" }), t("plan.flow.spawn")] }),
							(0, react_jsx_runtime.jsxs)("li", { children: [(0, react_jsx_runtime.jsx)("span", { children: "3" }), t("plan.flow.run")] })
						]
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: ActivityPanel_module_css_default.planSection,
						children: [(0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ActivityPanel_module_css_default.planSectionToggle,
							"aria-expanded": membersOpen,
							"aria-controls": membersId,
							onClick: () => {
								setMembersOpen((current) => !current);
							},
							children: [(0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsx)("strong", { children: t("plan.members.title") }), (0, react_jsx_runtime.jsx)("small", { children: t("plan.members.count", { count: team.members.length }) })] }), (0, react_jsx_runtime.jsx)(DisclosureChevron, { open: membersOpen })]
						}), membersOpen && (0, react_jsx_runtime.jsx)("div", {
							id: membersId,
							className: ActivityPanel_module_css_default.planList,
							children: team.members.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
								className: ActivityPanel_module_css_default.planEmpty,
								children: t("plan.members.empty")
							}) : team.members.map((member) => (0, react_jsx_runtime.jsx)(StagedMemberEditor, {
								team,
								member,
								modelDirectory,
								onPendingChange,
								t
							}, member.name))
						})]
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: ActivityPanel_module_css_default.planSection,
						children: [(0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ActivityPanel_module_css_default.planSectionToggle,
							"aria-expanded": tasksOpen,
							"aria-controls": tasksId,
							onClick: () => {
								setTasksOpen((current) => !current);
							},
							children: [(0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsx)("strong", { children: t("plan.tasks.title") }), (0, react_jsx_runtime.jsx)("small", { children: t("plan.tasks.count", {
								count: team.tasks.length,
								links: dependencyLinks
							}) })] }), (0, react_jsx_runtime.jsx)(DisclosureChevron, { open: tasksOpen })]
						}), tasksOpen && (0, react_jsx_runtime.jsx)("div", {
							id: tasksId,
							className: ActivityPanel_module_css_default.planList,
							children: team.tasks.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
								className: ActivityPanel_module_css_default.planEmpty,
								children: t("plan.tasks.empty")
							}) : team.tasks.map((task) => (0, react_jsx_runtime.jsx)(StagedTaskEditor, {
								team,
								task,
								onPendingChange,
								t
							}, task.id))
						})]
					}),
					(0, react_jsx_runtime.jsxs)("form", {
						className: ActivityPanel_module_css_default.planNewTask,
						onSubmit: (event) => {
							addTask(event);
						},
						children: [(0, react_jsx_runtime.jsxs)("label", { children: [(0, react_jsx_runtime.jsx)("span", { children: t("plan.newTaskLabel") }), (0, react_jsx_runtime.jsx)("input", {
							name: "newTask",
							value: newTask,
							onChange: (event) => {
								setNewTask(event.currentTarget.value);
								setFeedback(void 0);
							},
							placeholder: t("plan.newTask"),
							disabled: busy
						})] }), (0, react_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: busy || newTask.trim() === "",
							children: busy ? t("plan.adding") : t("plan.addTask")
						})]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: ActivityPanel_module_css_default.planApproveRow,
						"data-armed": discardArmed || void 0,
						"data-discard": discardArmed || void 0,
						"data-review-state": waitingForFeedback ? "awaiting-feedback" : "awaiting-review",
						children: [
							(0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.planApproveCopy,
								children: [(0, react_jsx_runtime.jsx)("strong", { children: discardArmed ? t("plan.discardConfirmTitle") : waitingForFeedback ? t("plan.feedbackTitle") : t("plan.approveTitle") }), (0, react_jsx_runtime.jsx)("small", { children: discardArmed ? t("plan.discardWarning") : waitingForFeedback ? t("plan.feedbackHint") : hasPendingEdits ? t("plan.pendingEdits") : t("plan.approveHint", {
									members: team.members.length,
									tasks: team.tasks.length
								}) })]
							}),
							(0, react_jsx_runtime.jsx)(Feedback, { value: feedback }),
							discardArmed ? (0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.planApproveActions,
								children: [(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: busy,
									onClick: () => {
										setDiscardArmed(false);
									},
									children: t("plan.cancel")
								}), (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									"data-plan-discard": true,
									"data-danger": true,
									"data-confirming": true,
									disabled: busy,
									onClick: () => {
										discard();
									},
									children: busy ? t("plan.discarding") : t("plan.discardConfirm")
								})]
							}) : (0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.planReviewActions,
								children: [(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									"data-plan-approve": true,
									disabled: busy || !runnable || hasPendingEdits,
									onClick: () => {
										approve();
									},
									children: t("plan.approve")
								}), (0, react_jsx_runtime.jsxs)("span", {
									className: ActivityPanel_module_css_default.planSecondaryActions,
									children: [(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										"data-plan-continue": true,
										disabled: busy,
										onClick: () => {
											continueInChat();
										},
										children: t(waitingForFeedback ? "plan.returnToChat" : "plan.continue")
									}), (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										"data-plan-discard": true,
										"data-danger": true,
										disabled: busy,
										onClick: () => {
											setDiscardArmed(true);
											setFeedback(void 0);
										},
										children: t("plan.discard")
									})]
								})]
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region lib/client/EmbeddedDiscussion.js
		/** A compact view over the same isolated native discussion session. */
		function EmbeddedDiscussion({ sessionId, teamId, discussion }) {
			const [chat, setChat] = (0, react.useState)({
				messages: [],
				busy: true
			});
			const [text, setText] = (0, react.useState)("");
			const [sending, setSending] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			const transcript = (0, react.useRef)(null);
			const previousCount = (0, react.useRef)(0);
			(0, react.useEffect)(() => {
				if (previousCount.current > 0 && chat.messages.length > previousCount.current && transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
				previousCount.current = chat.messages.length;
			}, [chat.messages.length]);
			async function request(action, message) {
				const response = await fetch("/plugins/dsh-agent-teams/workflow", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						sessionId,
						teamId,
						discussion,
						action,
						message
					})
				});
				const value = await response.json();
				if (!response.ok) throw new Error(value.error ?? `HTTP ${response.status}`);
				return value;
			}
			(0, react.useEffect)(() => {
				let live = true;
				const refresh = () => {
					request("conversation_state").then((value) => {
						if (live) {
							setChat(value);
							setError("");
						}
					}).catch((err) => {
						if (live) setError(err instanceof Error ? err.message : String(err));
					});
				};
				refresh();
				const timer = setInterval(refresh, 2e3);
				return () => {
					live = false;
					clearInterval(timer);
				};
			}, [
				sessionId,
				teamId,
				discussion
			]);
			async function send() {
				const message = text.trim();
				if (!message || sending || chat.busy) return;
				setSending(true);
				setError("");
				try {
					const result = await request("conversation_send", message);
					setChat(result);
					setText("");
				} catch (err) {
					setError(err instanceof Error ? err.message : String(err));
				} finally {
					setSending(false);
				}
			}
			return (0, react_jsx_runtime.jsxs)("div", {
				className: WorkflowWorkbench_module_css_default.embeddedChat,
				children: [(0, react_jsx_runtime.jsxs)("div", {
					ref: transcript,
					className: WorkflowWorkbench_module_css_default.embeddedTranscript,
					"aria-label": "独立讨论记录",
					children: [
						chat.messages.map((message) => (0, react_jsx_runtime.jsxs)("div", {
							className: message.role === "user" ? WorkflowWorkbench_module_css_default.userMessage : WorkflowWorkbench_module_css_default.assistantMessage,
							children: [(0, react_jsx_runtime.jsx)("strong", { children: message.role === "user" ? "你" : "AI" }), (0, react_jsx_runtime.jsx)("p", { children: message.text })]
						}, message.id)),
						chat.busy && (0, react_jsx_runtime.jsx)("p", {
							role: "status",
							children: "AI 正在思考…"
						}),
						error && (0, react_jsx_runtime.jsx)("p", {
							role: "alert",
							className: WorkflowWorkbench_module_css_default.error,
							children: error
						})
					]
				}), (0, react_jsx_runtime.jsxs)("form", {
					className: WorkflowWorkbench_module_css_default.embeddedComposer,
					onSubmit: (event) => {
						event.preventDefault();
						send();
					},
					children: [(0, react_jsx_runtime.jsxs)("label", { children: ["继续讨论", (0, react_jsx_runtime.jsx)("textarea", {
						value: text,
						onChange: (event) => setText(event.target.value),
						placeholder: "例如：让这个 Agent 更专注于需求分析…"
					})] }), (0, react_jsx_runtime.jsx)("button", {
						type: "submit",
						disabled: !text.trim() || chat.busy || sending,
						children: "发送"
					})]
				})]
			});
		}
		//#endregion
		//#region lib/client/proposal-review.js
		const memberFields = [
			"summary",
			"role",
			"executionPrompt",
			"provider",
			"model",
			"reasoningEffort"
		];
		const taskFields = [
			"subject",
			"description",
			"assignee",
			"dependencies"
		];
		const labels = {
			name: "成员名称",
			id: "任务 ID",
			summary: "Summary · 功能概述",
			role: "长期职责",
			executionPrompt: "执行指令 / PE",
			provider: "模型提供方",
			model: "模型",
			reasoningEffort: "Thinking",
			subject: "任务名称",
			description: "任务要求 / 验收要求",
			assignee: "负责人",
			dependencies: "上游任务 ID",
			taskIds: "返工任务 ID",
			instructions: "返工要求"
		};
		const show = (value) => Array.isArray(value) ? value.join("\n") : typeof value === "string" ? value : "";
		function reviewFields(team, operation) {
			const op = operation;
			const isMember = operation.action.endsWith("member");
			const removed = operation.action.startsWith("remove_");
			const added = operation.action.startsWith("add_");
			const original = isMember ? team.members.find((item) => item.name === op["name"]) : team.tasks.find((item) => item.id === op["id"]);
			const before = added ? {} : original ?? {};
			const fields = (operation.action === "rework" ? ["taskIds", "instructions"] : isMember ? [...added ? ["name"] : [], ...memberFields] : [...added && op["id"] ? ["id"] : [], ...taskFields]).filter((key) => !(key === "assignee" && operation.action === "add_task" && operation.checkpoint)).map((key) => ({
				key,
				label: labels[key] ?? key,
				before: show(before[key]),
				after: removed ? "" : show(op[key] === void 0 && !added ? before[key] : op[key]),
				array: ["dependencies", "taskIds"].includes(key),
				editable: !removed && key !== "id"
			}));
			const name = String(isMember ? op["name"] : op["subject"] ?? before["subject"] ?? op["id"]);
			return {
				title: `${added ? "新增" : removed ? "删除" : operation.action === "rework" ? "返工" : "修改"}${isMember ? "成员" : operation.action === "add_task" && op["checkpoint"] ? "人工检查" : "任务"} · ${name}`,
				fields
			};
		}
		function setReviewField(operation, field, value) {
			return {
				...operation,
				[field.key]: field.array ? [...new Set(value.split(/[\n,，]+/u).map((item) => item.trim()).filter(Boolean))] : value
			};
		}
		function reviewedOperations(team, operations, included) {
			return operations.flatMap((operation, index) => {
				if (!included[index]) return [];
				if (!operation.action.startsWith("update_")) return [operation];
				const result = operation.action === "update_member" ? {
					action: operation.action,
					name: operation.name
				} : {
					action: operation.action,
					id: operation.id
				};
				for (const field of reviewFields(team, operation).fields) if (field.before !== field.after) result[field.key] = operation[field.key];
				return Object.keys(result).length > 2 ? [result] : [];
			});
		}
		function lineDiff(before, after) {
			if (before === after) return before.split("\n").map((text) => ({
				kind: "same",
				text
			}));
			const a = before ? before.split("\n") : [], b = after ? after.split("\n") : [];
			if (a.length * b.length > 16e4) return [...a.map((text) => ({
				kind: "removed",
				text
			})), ...b.map((text) => ({
				kind: "added",
				text
			}))];
			const table = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
			for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
			const result = [];
			let i = 0, j = 0;
			while (i < a.length || j < b.length) if (i < a.length && j < b.length && a[i] === b[j]) {
				result.push({
					kind: "same",
					text: a[i++]
				});
				j++;
			} else if (i < a.length && (j === b.length || table[i + 1][j] >= table[i][j + 1])) result.push({
				kind: "removed",
				text: a[i++]
			});
			else result.push({
				kind: "added",
				text: b[j++]
			});
			return result;
		}
		//#endregion
		//#region \0dsh-css:G:\dsh_agents\src\client\ProposalReview.module.css.mjs
		const css$2 = "._0TLTsG_review{font-size:12px;line-height:1.65;container-type:inline-size}._0TLTsG_review header p{color:var(--wb-muted);margin:6px 0 10px}._0TLTsG_actions{z-index:1;background:var(--wb-bg);flex-wrap:wrap;gap:6px;padding:6px 0;display:flex;position:sticky;top:0}._0TLTsG_actions button{font:inherit;color:inherit;background:var(--wb-bg);border:1px solid var(--wb-border);cursor:pointer;border-radius:6px;padding:5px 9px}._0TLTsG_actions ._0TLTsG_apply{color:var(--wb-accent);border-color:var(--wb-accent);font-weight:600}._0TLTsG_actions button:disabled{opacity:.5;cursor:not-allowed}._0TLTsG_operation{border:1px solid var(--wb-border);border-radius:8px;margin:10px 0 16px;overflow:hidden}._0TLTsG_include{background:var(--wb-base);align-items:flex-start;gap:6px;padding:9px;font-weight:600;display:flex}._0TLTsG_include input{flex:none;margin-top:4px}._0TLTsG_field{border-top:1px solid var(--wb-border);padding:9px}._0TLTsG_fieldHeading{flex-wrap:wrap;justify-content:space-between;gap:6px;margin-bottom:5px;display:flex}._0TLTsG_fieldHeading>span{color:var(--wb-muted);font-size:11px}._0TLTsG_pair{gap:8px;display:grid}._0TLTsG_pair>*{min-width:0}._0TLTsG_caption{color:var(--wb-muted);margin:2px 0 4px;font-size:11px;display:block}._0TLTsG_review pre,._0TLTsG_review textarea{box-sizing:border-box;font:inherit;white-space:pre-wrap;overflow-wrap:anywhere;border:1px solid var(--wb-border);background:var(--wb-bg);width:100%;color:inherit;border-radius:6px;max-height:260px;margin:0;padding:8px;overflow:auto}._0TLTsG_review textarea{resize:vertical;min-height:64px}._0TLTsG_field[data-change=added] ._0TLTsG_pair>label textarea,._0TLTsG_field[data-change=changed] ._0TLTsG_pair>label textarea{border-color:var(--wb-accent)}._0TLTsG_review details{margin-top:6px}._0TLTsG_review summary{color:var(--wb-muted);cursor:pointer;font-size:11px}._0TLTsG_diff{border:1px solid var(--wb-border);border-radius:5px;max-height:260px;margin-top:4px;overflow:auto}._0TLTsG_diff>div{white-space:pre-wrap;overflow-wrap:anywhere;gap:7px;padding:3px 6px;display:flex}._0TLTsG_diff>div>span{flex:none;width:12px;font-family:monospace}._0TLTsG_diff code{font:inherit;min-width:0}._0TLTsG_diff [data-kind=same]{color:var(--wb-muted)}._0TLTsG_diff [data-kind=added]{color:light-dark(#17613c,#a1e1ba);background:light-dark(#e5f5eb,#173d2a)}._0TLTsG_diff [data-kind=removed]{color:light-dark(#a02e28,#f5b2ad);background:light-dark(#fff0ee,#482322)}._0TLTsG_operation[data-included=false]>._0TLTsG_field{opacity:.55}._0TLTsG_review [role=alert]{color:var(--wb-error)}@container (width>=400px){._0TLTsG_pair{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}";
		const tagId$2 = "@yogurtss/dsh-teamflow/ProposalReview.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@yogurtss/dsh-teamflow";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var ProposalReview_module_css_default = {
			"actions": "_0TLTsG_actions",
			"apply": "_0TLTsG_apply",
			"caption": "_0TLTsG_caption",
			"diff": "_0TLTsG_diff",
			"field": "_0TLTsG_field",
			"fieldHeading": "_0TLTsG_fieldHeading",
			"include": "_0TLTsG_include",
			"operation": "_0TLTsG_operation",
			"pair": "_0TLTsG_pair",
			"review": "_0TLTsG_review"
		};
		//#endregion
		//#region lib/client/ProposalReview.js
		/** Editable human approval, shared by the workbench and discussion sidebar. */
		function ProposalReview({ team, proposal, base, busy, onApply, onDismiss, draft, onChange }) {
			const [original] = (0, react.useState)(() => structuredClone(team));
			const operations = draft?.operations ?? proposal.operations;
			const included = draft?.included ?? proposal.operations.map(() => true);
			const effective = reviewedOperations(original, operations, included);
			const stale = base !== proposal.base;
			const edited = JSON.stringify(operations) !== JSON.stringify(proposal.operations) || included.some((value) => !value);
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ProposalReview_module_css_default.review,
				"aria-label": "审批修改对照",
				children: [
					(0, react_jsx_runtime.jsxs)("header", { children: [(0, react_jsx_runtime.jsx)("strong", { children: proposal.title }), (0, react_jsx_runtime.jsx)("p", { children: "绿色 + 新增 · 红色 − 删除 · = 相同。可直接编辑「之后」，确认后生效。" })] }),
					(0, react_jsx_runtime.jsxs)("div", {
						className: ProposalReview_module_css_default.actions,
						children: [
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ProposalReview_module_css_default.apply,
								disabled: busy || stale || effective.length === 0,
								onClick: () => onApply(effective),
								children: edited ? "确认应用编辑后的内容" : "确认应用"
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: busy,
								onClick: onDismiss,
								children: "放弃修改"
							}),
							edited && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: busy,
								onClick: () => onChange({
									operations: structuredClone(proposal.operations),
									included: proposal.operations.map(() => true)
								}),
								children: "恢复 AI 建议"
							})
						]
					}),
					stale && (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						children: "团队已变化，此提案已过期。请与 AI 重新确认，避免覆盖新结果。"
					}),
					!effective.length && (0, react_jsx_runtime.jsx)("p", {
						role: "status",
						children: "当前没有要应用的改动，可以继续编辑或放弃修改。"
					}),
					operations.map((operation, index) => {
						const comparison = reviewFields(original, operation);
						return (0, react_jsx_runtime.jsxs)("article", {
							className: ProposalReview_module_css_default.operation,
							"data-included": included[index],
							children: [(0, react_jsx_runtime.jsxs)("label", {
								className: ProposalReview_module_css_default.include,
								children: [
									(0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: included[index],
										disabled: busy,
										onChange: (event) => onChange({
											operations,
											included: included.map((value, i) => i === index ? event.target.checked : value)
										})
									}),
									"应用此项 · ",
									comparison.title
								]
							}), comparison.fields.map((field) => {
								const same = field.before === field.after;
								return (0, react_jsx_runtime.jsxs)("section", {
									className: ProposalReview_module_css_default.field,
									"data-change": same ? "same" : !field.before ? "added" : !field.after ? "removed" : "changed",
									children: [
										(0, react_jsx_runtime.jsxs)("div", {
											className: ProposalReview_module_css_default.fieldHeading,
											children: [(0, react_jsx_runtime.jsx)("strong", { children: field.label }), (0, react_jsx_runtime.jsx)("span", { children: same ? "= 相同" : !field.before ? "+ 新增" : !field.after ? "− 删除" : "± 修改" })]
										}),
										(0, react_jsx_runtime.jsxs)("div", {
											className: ProposalReview_module_css_default.pair,
											children: [(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("span", {
												className: ProposalReview_module_css_default.caption,
												children: "之前"
											}), (0, react_jsx_runtime.jsx)("pre", { children: field.before || "（空）" })] }), (0, react_jsx_runtime.jsxs)("label", { children: [(0, react_jsx_runtime.jsxs)("span", {
												className: ProposalReview_module_css_default.caption,
												children: ["之后", field.editable ? " · 可编辑" : ""]
											}), field.editable ? (0, react_jsx_runtime.jsx)("textarea", {
												"aria-label": `${comparison.title} · ${field.label} · 之后`,
												rows: Math.min(9, Math.max(2, field.after.split("\n").length)),
												value: field.after,
												disabled: busy || !included[index],
												onChange: (event) => onChange({
													included,
													operations: operations.map((op, i) => i === index ? setReviewField(op, field, event.target.value) : op)
												})
											}) : (0, react_jsx_runtime.jsx)("pre", { children: "（删除该对象）" })] })]
										}),
										!same && (0, react_jsx_runtime.jsxs)("details", {
											open: true,
											children: [(0, react_jsx_runtime.jsx)("summary", { children: "逐行差异" }), (0, react_jsx_runtime.jsx)("div", {
												className: ProposalReview_module_css_default.diff,
												children: lineDiff(field.before, field.after).map((line, i) => (0, react_jsx_runtime.jsxs)("div", {
													"data-kind": line.kind,
													children: [(0, react_jsx_runtime.jsx)("span", {
														"aria-label": line.kind === "same" ? "相同" : line.kind === "added" ? "新增" : "删除",
														children: line.kind === "same" ? "=" : line.kind === "added" ? "+" : "−"
													}), (0, react_jsx_runtime.jsx)("code", { children: line.text || " " })]
												}, i))
											})]
										})
									]
								}, field.key);
							})]
						}, index);
					})
				]
			});
		}
		//#endregion
		//#region lib/client/WorkflowWorkbench.js
		/** Editable task canvas and isolated configuration / human-review discussions. */
		async function request$1(payload) {
			const response = await fetch("/plugins/dsh-agent-teams/workflow", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(payload)
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error ?? `HTTP ${response.status}`);
			if (!result.team) return;
			return result;
		}
		const taskStatus = (task, ready) => task.workflowPaused ? "已暂停 · 可编辑" : task.checkpoint?.decision === "reject" ? "已拒绝 · 等待返工" : ready.includes(task.id) ? "等待人工验收" : {
			pending: "等待执行",
			claimed: "已领取",
			in_progress: "执行中",
			completed: "已完成",
			failed: "失败",
			cancelled: "已取消"
		}[task.status];
		function ReviewMaterials({ text }) {
			try {
				const material = JSON.parse(text);
				if (!Array.isArray(material.results) || !material.check) return (0, react_jsx_runtime.jsx)("pre", { children: text });
				return (0, react_jsx_runtime.jsxs)("div", {
					className: WorkflowWorkbench_module_css_default.materials,
					children: [
						(0, react_jsx_runtime.jsxs)("small", { children: [
							"第 ",
							material.check.round,
							" 轮验收"
						] }),
						material.results.length === 0 && (0, react_jsx_runtime.jsx)("p", { children: "此检查点没有上游执行结果，请根据验收要求确认是否继续。" }),
						material.results.map((result) => (0, react_jsx_runtime.jsxs)("section", { children: [
							(0, react_jsx_runtime.jsx)("strong", { children: result.subject }),
							(0, react_jsx_runtime.jsx)("p", { children: result.output || "尚未提交结果说明" }),
							result.commandsRun?.map((command, i) => (0, react_jsx_runtime.jsxs)("p", { children: [
								command.status === "passed" ? "通过" : "未通过",
								" · ",
								command.command,
								command.evidence ? `\n${command.evidence}` : ""
							] }, i)),
							result.acceptanceResults?.map((item, i) => (0, react_jsx_runtime.jsxs)("p", { children: [
								item.status === "passed" ? "通过" : "未通过",
								" · ",
								item.criterion,
								item.evidence ? `\n${item.evidence}` : ""
							] }, i))
						] }, result.id)),
						!!material.files?.artifacts.length && (0, react_jsx_runtime.jsxs)("section", { children: [(0, react_jsx_runtime.jsx)("strong", { children: "相关文件" }), material.files.artifacts.map((file) => (0, react_jsx_runtime.jsxs)("p", { children: [file.path, file.unreadable ? " · 无法读取" : !file.present ? " · 文件不存在" : ""] }, file.path))] }),
						(0, react_jsx_runtime.jsx)("p", {
							className: WorkflowWorkbench_module_css_default.hint,
							children: material.limitation
						}),
						(0, react_jsx_runtime.jsxs)("details", { children: [(0, react_jsx_runtime.jsx)("summary", { children: "原始证据记录" }), (0, react_jsx_runtime.jsx)("pre", { children: text })] })
					]
				});
			} catch {
				return (0, react_jsx_runtime.jsx)("pre", { children: text });
			}
		}
		function WorkflowWorkbench({ sessionId, teamId, waitingCount = 0, openExecution, openConversation, nativeOnly = false, reviewEntryOnly = false, embeddedContext = false, onNativeContext, openContext, modelDirectory, t }) {
			const [opened, setOpened] = (0, react.useState)(false);
			const [data, setData] = (0, react.useState)();
			const [activeId, setActiveId] = (0, react.useState)(teamId);
			const [discussion, setDiscussion] = (0, react.useState)("graph");
			const [selectedTask, setSelectedTask] = (0, react.useState)();
			const [error, setError] = (0, react.useState)("");
			const [feedback, setFeedback] = (0, react.useState)("");
			const [reviewDrafts, setReviewDrafts] = (0, react.useState)({});
			const [working, setWorking] = (0, react.useState)(false);
			const [note, setNote] = (0, react.useState)("");
			const [embeddedDiscussion, setEmbeddedDiscussion] = (0, react.useState)();
			const [pane, setPane] = (0, react.useState)("flow");
			const [name, setName] = (0, react.useState)("新团队");
			const [goal, setGoal] = (0, react.useState)("");
			const [editor, setEditor] = (0, react.useState)();
			const [draft, setDraft] = (0, react.useState)({});
			const [selectedEdge, setSelectedEdge] = (0, react.useState)();
			const [zoom, setZoom] = (0, react.useState)(1);
			const [positions, setPositions] = (0, react.useState)({});
			const [link, setLink] = (0, react.useState)();
			const suppressNodeClick = (0, react.useRef)(false);
			const cancelLink = (0, react.useRef)(void 0);
			const canvas = (0, react.useRef)(null);
			const dialog = (0, react.useRef)(null);
			const mounted = (0, react.useRef)(true);
			const generation = (0, react.useRef)(0);
			const initializedDiscussion = (0, react.useRef)(false);
			const team = data?.team;
			const conversation = team?.workflow?.discussions[`discussion:${discussion}`];
			const proposal = conversation?.proposal?.status === "pending" ? conversation.proposal : void 0;
			const reviewTask = discussion.startsWith("check:") ? team?.tasks.find((t) => t.id === discussion.slice(6)) : void 0;
			const activeTask = team?.tasks.find((t) => t.id === selectedTask);
			const member = discussion.startsWith("member:") ? team?.members.find((m) => m.name === discussion.slice(7)) : void 0;
			const defaultPositions = (0, react.useMemo)(() => {
				const tasks = team?.tasks ?? [], depths = /* @__PURE__ */ new Map(), rows = /* @__PURE__ */ new Map();
				function depth(id, seen = /* @__PURE__ */ new Set()) {
					if (depths.has(id)) return depths.get(id);
					if (seen.has(id)) return 0;
					const next = new Set(seen).add(id), task = tasks.find((t) => t.id === id);
					const value = task?.dependencies.length ? 1 + Math.max(...task.dependencies.map((dep) => depth(dep, next))) : 0;
					depths.set(id, value);
					return value;
				}
				return Object.fromEntries(tasks.map((task) => {
					const column = depth(task.id), row = rows.get(column) ?? 0;
					rows.set(column, row + 1);
					return [task.id, {
						x: 32 + column * 270,
						y: 32 + row * 160
					}];
				}));
			}, [team?.tasks]);
			const taskEditing = !!editor && editor.type !== "member";
			(0, react.useEffect)(() => {
				onNativeContext?.(!!data?.currentDiscussion);
			}, [data?.currentDiscussion, onNativeContext]);
			const selectDiscussion = (key) => {
				setDiscussion(key);
				setPane("discussion");
			};
			(0, react.useEffect)(() => {
				mounted.current = true;
				return () => {
					mounted.current = false;
				};
			}, []);
			(0, react.useEffect)(() => {
				if (!opened) return;
				const previous = document.activeElement;
				dialog.current?.querySelector("button, input")?.focus();
				return () => previous?.focus();
			}, [opened]);
			(0, react.useEffect)(() => {
				if (editor && !editor.id) dialog.current?.querySelector("[data-workflow-editor] input:not(:disabled), [data-workflow-editor] textarea")?.focus();
			}, [editor]);
			(0, react.useEffect)(() => {
				if (teamId && teamId !== activeId) {
					setActiveId(teamId);
					setData(void 0);
					setDiscussion("graph");
					setPositions({});
					setSelectedTask(void 0);
					setEditor(void 0);
					initializedDiscussion.current = false;
					generation.current++;
				}
			}, [sessionId, teamId]);
			const refresh = async () => {
				const token = generation.current;
				try {
					const result = await request$1({
						sessionId,
						teamId: activeId,
						action: "state"
					});
					if (!result) return;
					if (mounted.current && token === generation.current) {
						setData(result);
						setActiveId(result.team.id);
						if (!initializedDiscussion.current && result.currentDiscussion) {
							initializedDiscussion.current = true;
							setDiscussion(result.currentDiscussion);
							setPane("discussion");
						}
					}
				} catch (err) {
					if (mounted.current && token === generation.current && activeId) setError(String(err));
				}
			};
			(0, react.useEffect)(() => {
				if (working || !activeId && data) return;
				refresh();
				const timer = setInterval(() => {
					if (!working) refresh();
				}, 2500);
				return () => clearInterval(timer);
			}, [activeId, working]);
			async function perform(action, fields = {}) {
				setWorking(true);
				setError("");
				setFeedback("");
				const token = ++generation.current;
				try {
					const result = await request$1({
						sessionId,
						teamId: activeId,
						discussion,
						action,
						...fields
					});
					if (!result) return;
					if (mounted.current && token === generation.current) {
						setData(result);
						setActiveId(result.team.id);
					}
					return result;
				} catch (err) {
					if (mounted.current) setError(err instanceof Error ? err.message : String(err));
					return;
				} finally {
					if (mounted.current) setWorking(false);
				}
			}
			async function openDiscussion(key = discussion, targetId = activeId, fresh = false, message) {
				selectDiscussion(key);
				if (!openConversation) {
					setError("请在 DSH 中打开原生对话；开发预览不连接模型。");
					return;
				}
				const result = await perform("open_discussion", {
					discussion: key,
					teamId: targetId,
					fresh,
					message
				});
				if (result?.openedSessionId) {
					if (result.openedSessionId === team?.captainSessionId || !result.openedSessionId.startsWith("session-at-discussion-")) {
						setError("宿主未返回独立讨论会话，已取消跳转");
						return;
					}
					try {
						await openConversation(result.openedSessionId);
						setOpened(false);
						openContext?.();
					} catch (error) {
						setError(String(error));
					}
				}
			}
			async function createFlow() {
				const created = await perform("create", {
					name,
					description: goal
				});
				if (created) await startEmbedded("graph", created.team.id);
			}
			async function saveEdit(operations, title, finishEditing = false) {
				if (await perform("edit", {
					operations,
					title,
					base: data?.base,
					positions: Object.fromEntries(team?.tasks.map((task) => [task.id, pos(task.id)]) ?? [])
				})) {
					if (finishEditing) setEditor(void 0);
					setSelectedEdge(void 0);
				}
			}
			async function startEmbedded(key, targetId = activeId, fresh = false) {
				setEditor(void 0);
				setSelectedEdge(void 0);
				setSelectedTask(void 0);
				selectDiscussion(key);
				const result = await perform("open_discussion", {
					discussion: key,
					teamId: targetId,
					fresh
				});
				if (result?.openedSessionId && result.openedSessionId.startsWith("session-at-discussion-") && result.openedSessionId !== team?.captainSessionId) setEmbeddedDiscussion(key);
				else if (result) setError("宿主未返回独立讨论会话");
			}
			function prepareDiscussion(name) {
				startEmbedded(`member:${name}`, activeId, true);
			}
			async function deleteEdge() {
				const target = team?.tasks.find((task) => task.id === selectedEdge?.to);
				if (!target || !selectedEdge || working) return;
				await saveEdit([{
					action: "update_task",
					id: target.id,
					dependencies: target.dependencies.filter((id) => id !== selectedEdge.from)
				}], "删除任务交接");
			}
			async function deleteNode(id) {
				if (!team || working) return;
				const updates = team.tasks.filter((task) => task.dependencies.includes(id)).map((task) => ({
					action: "update_task",
					id: task.id,
					dependencies: task.dependencies.filter((dep) => dep !== id)
				}));
				updates.push({
					action: "remove_task",
					id
				});
				if (await perform("edit", {
					operations: updates,
					title: "删除节点及其连接",
					base: data?.base,
					positions: Object.fromEntries(team.tasks.map((task) => [task.id, pos(task.id)]))
				})) {
					setEditor(void 0);
					setSelectedTask(void 0);
				}
			}
			function beginNodeDrag(event, task) {
				if (event.button !== 0 || working || event.target.closest("[data-connection-handle]")) return;
				const target = event.currentTarget, start = point(event), original = pos(task.id);
				let last = original, moved = false;
				target.setPointerCapture(event.pointerId);
				const cleanup = () => {
					target.onpointermove = null;
					target.onpointerup = null;
					target.onpointercancel = null;
					if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
				};
				target.onpointermove = (move) => {
					const at = point(move);
					if (!moved && Math.hypot(at.x - start.x, at.y - start.y) < 4 / zoom) return;
					moved = true;
					suppressNodeClick.current = true;
					setSelectedTask(task.id);
					setSelectedEdge(void 0);
					last = {
						x: Math.min(1e4, Math.max(0, original.x + at.x - start.x)),
						y: Math.min(1e4, Math.max(0, original.y + at.y - start.y))
					};
					setPositions((prev) => ({
						...prev,
						[task.id]: last
					}));
				};
				target.onpointerup = () => {
					cleanup();
					if (moved) perform("layout", {
						taskId: task.id,
						...last
					}).then(() => setPositions((prev) => {
						const next = { ...prev };
						delete next[task.id];
						return next;
					}));
				};
				target.onpointercancel = () => {
					cleanup();
					suppressNodeClick.current = false;
					setPositions((prev) => {
						const next = { ...prev };
						delete next[task.id];
						return next;
					});
				};
			}
			function edit(type, id) {
				setEditor({
					type,
					id
				});
				setPane(type === "member" ? "members" : "flow");
				setError("");
				setSelectedEdge(void 0);
				const m = team?.members.find((item) => item.name === id), t = team?.tasks.find((item) => item.id === id);
				setDraft(type === "member" ? {
					name: m?.name ?? "",
					summary: m?.summary ?? m?.role ?? "",
					role: m?.role ?? "",
					executionPrompt: m?.executionPrompt ?? "",
					provider: m?.provider ?? "",
					model: m?.model ?? "",
					reasoningEffort: m?.reasoningEffort ?? "",
					routeChanged: ""
				} : {
					subject: t?.subject ?? "",
					description: t?.description ?? "",
					assignee: t?.assignee ?? ""
				});
			}
			const field = (key, label, multiline = false) => (0, react_jsx_runtime.jsxs)("label", { children: [label, multiline ? (0, react_jsx_runtime.jsx)("textarea", {
				required: key === "summary" && !editor?.id,
				value: draft[key] ?? "",
				onChange: (e) => setDraft({
					...draft,
					[key]: e.target.value
				})
			}) : (0, react_jsx_runtime.jsx)("input", {
				required: key === "name" || key === "subject" || key === "summary" && !editor?.id,
				value: draft[key] ?? "",
				disabled: key === "name" && !!editor?.id,
				onChange: (e) => setDraft({
					...draft,
					[key]: e.target.value
				})
			})] });
			function pos(id) {
				return positions[id] ?? team?.workflow?.positions[`task:${id}`] ?? defaultPositions[id] ?? {
					x: 32,
					y: 32
				};
			}
			function point(event) {
				const bounds = canvas.current.getBoundingClientRect();
				return {
					x: (event.clientX - bounds.left + canvas.current.scrollLeft) / zoom,
					y: (event.clientY - bounds.top + canvas.current.scrollTop) / zoom
				};
			}
			const draftPosition = editor?.id ? pos(editor.id) : {
				x: 32,
				y: Math.max(-128, ...team?.tasks.map((t) => pos(t.id).y) ?? []) + 160
			};
			const graphWidth = Math.max(580, ...team?.tasks.map((t) => pos(t.id).x + 265) ?? [], taskEditing ? draftPosition.x + 265 : 0);
			const graphHeight = Math.max(260, ...team?.tasks.map((t) => pos(t.id).y + 170) ?? [], taskEditing ? draftPosition.y + 170 : 0);
			function fitCanvas() {
				if (!canvas.current) return;
				setZoom(Math.max(.45, Math.min(1, (canvas.current.clientWidth - 20) / graphWidth)));
			}
			async function openReview(id) {
				selectDiscussion(`check:${id}`);
				setSelectedTask(id);
				if (await perform("materials", { discussion: `check:${id}` })) {
					setOpened(true);
					await startEmbedded(`check:${id}`);
				}
			}
			function renderProposalReview() {
				if (!proposal || !team || !data) return null;
				return (0, react_jsx_runtime.jsx)(ProposalReview, {
					team,
					proposal,
					base: data.base,
					busy: working,
					draft: reviewDrafts[proposal.id],
					onChange: (draft) => setReviewDrafts((prev) => ({
						...prev,
						[proposal.id]: draft
					})),
					onApply: (operations) => void perform("apply", {
						proposalId: proposal.id,
						operations
					}).then((result) => {
						if (result) setFeedback("修改已应用，可继续讨论。");
					}),
					onDismiss: () => void perform("dismiss", { proposalId: proposal.id }).then((result) => {
						if (result) setFeedback("修改已放弃，可以继续讨论。");
					})
				}, proposal.id);
			}
			const pendingProposals = Object.entries(team?.workflow?.discussions ?? {}).filter(([key, item]) => key.startsWith("discussion:") && item.proposal?.status === "pending").map(([, item]) => item);
			const pendingCount = pendingProposals.length;
			const pendingNotice = pendingCount > 0 && (0, react_jsx_runtime.jsxs)("div", {
				className: WorkflowWorkbench_module_css_default.pendingNotice,
				role: "status",
				children: [
					(0, react_jsx_runtime.jsxs)("strong", { children: [
						"有 ",
						pendingCount,
						" 项修改等待确认"
					] }),
					pendingProposals.map((item) => (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: working || !!editor,
						onClick: () => {
							setSelectedTask(void 0);
							setSelectedEdge(void 0);
							selectDiscussion(item.key);
							setOpened(true);
						},
						children: ["查看并决定 · ", item.proposal.title]
					}, item.key)),
					!!editor && (0, react_jsx_runtime.jsx)("small", { children: "先保存或取消当前编辑，再查看待确认修改。" })
				]
			});
			const reviewCount = data?.ready.length ?? waitingCount;
			const reviewNotice = !!data?.ready.length && (0, react_jsx_runtime.jsxs)("div", {
				className: WorkflowWorkbench_module_css_default.reviewNotice,
				role: "status",
				"aria-label": "等待你验收",
				children: [
					(0, react_jsx_runtime.jsxs)("strong", { children: [(0, react_jsx_runtime.jsx)("span", {
						className: WorkflowWorkbench_module_css_default.reviewDot,
						"aria-hidden": true
					}), "等待你验收"] }),
					data.ready.map((id) => (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: working,
						onClick: () => void openReview(id),
						children: [
							"验收 · ",
							team?.tasks.find((t) => t.id === id)?.subject,
							" ↗"
						]
					}, id)),
					!reviewEntryOnly && (0, react_jsx_runtime.jsx)("small", { children: "上游已完成 · 打开独立对话查看材料与 AI 总结" })
				]
			});
			if (reviewEntryOnly && !opened) return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [reviewNotice, error && (0, react_jsx_runtime.jsx)("span", {
				role: "alert",
				children: error
			})] });
			if (nativeOnly && !data?.currentDiscussion) return null;
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				data?.currentDiscussion && team && (0, react_jsx_runtime.jsxs)("div", {
					className: WorkflowWorkbench_module_css_default.nativeBanner,
					children: [(0, react_jsx_runtime.jsxs)("span", { children: [
						data.currentDiscussion.startsWith("check:") ? "独立验收对话" : "独立配置对话",
						" · ",
						team.name
					] }), (0, react_jsx_runtime.jsx)("button", {
						className: WorkflowWorkbench_module_css_default.entry,
						onClick: () => void openExecution?.(team.captainSessionId, team.captainSessionId),
						children: "返回团队对话 ↗"
					})]
				}),
				!reviewEntryOnly && (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: `${WorkflowWorkbench_module_css_default.entry} ${nativeOnly ? WorkflowWorkbench_module_css_default.compact : WorkflowWorkbench_module_css_default.launcher}`,
					"aria-haspopup": "dialog",
					onClick: () => setOpened(true),
					children: [
						(0, react_jsx_runtime.jsxs)("strong", { children: ["团队与流程 ", (0, react_jsx_runtime.jsx)("span", {
							"aria-hidden": true,
							children: "↗"
						})] }),
						!nativeOnly && (0, react_jsx_runtime.jsx)("span", { children: team?.name ?? (activeId ? "查看成员、任务交接与人工检查" : "讨论目标，创建初步团队") }),
						pendingCount > 0 && (0, react_jsx_runtime.jsxs)("span", { children: [pendingCount, " 项修改待确认"] }),
						reviewCount > 0 && (0, react_jsx_runtime.jsxs)("span", { children: [reviewCount, " 项等待人工验收"] })
					]
				}),
				!nativeOnly && !reviewEntryOnly && team?.phase === "staged" && (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: `${WorkflowWorkbench_module_css_default.entry} ${WorkflowWorkbench_module_css_default.startEntry}`,
					disabled: working || !!editor || pendingCount > 0,
					title: editor ? "请在工作台保存或取消当前编辑" : pendingCount ? "请先处理待确认的修改" : void 0,
					onClick: () => void perform("start"),
					children: "确认并启动团队"
				}),
				!opened && !nativeOnly && !reviewEntryOnly && pendingNotice,
				error && !opened && (0, react_jsx_runtime.jsx)("div", {
					className: WorkflowWorkbench_module_css_default.error,
					role: "alert",
					children: error
				}),
				!nativeOnly && reviewNotice,
				nativeOnly && data?.currentDiscussion && openContext && (0, react_jsx_runtime.jsx)("button", {
					className: `${WorkflowWorkbench_module_css_default.entry} ${WorkflowWorkbench_module_css_default.compact}`,
					onClick: openContext,
					children: proposal ? "查看待确认修改 ↗" : "团队与讨论资料 ↗"
				}),
				embeddedContext && team && (0, react_jsx_runtime.jsxs)("section", {
					className: WorkflowWorkbench_module_css_default.contextPanel,
					"aria-label": "讨论资料",
					children: [
						(0, react_jsx_runtime.jsxs)("header", { children: [(0, react_jsx_runtime.jsx)("strong", { children: "讨论资料" }), (0, react_jsx_runtime.jsx)("span", { children: "当前已保存的信息" })] }),
						(0, react_jsx_runtime.jsxs)("label", { children: ["查看对象", (0, react_jsx_runtime.jsxs)("select", {
							value: discussion,
							onChange: (event) => setDiscussion(event.target.value),
							children: [
								(0, react_jsx_runtime.jsx)("option", {
									value: "graph",
									children: "团队与流程"
								}),
								team.members.filter((m) => m.status !== "removed").map((m) => (0, react_jsx_runtime.jsx)("option", {
									value: `member:${m.name}`,
									children: m.name
								}, m.name)),
								team.tasks.filter((t) => t.checkpoint).map((t) => (0, react_jsx_runtime.jsxs)("option", {
									value: `check:${t.id}`,
									children: ["验收 · ", t.subject]
								}, t.id))
							]
						})] }),
						feedback && (0, react_jsx_runtime.jsx)("p", {
							role: "status",
							children: feedback
						}),
						conversation?.materials && (0, react_jsx_runtime.jsxs)("details", { children: [(0, react_jsx_runtime.jsx)("summary", { children: "本轮验收证据" }), (0, react_jsx_runtime.jsx)(ReviewMaterials, { text: conversation.materials })] }),
						proposal && !opened && (0, react_jsx_runtime.jsxs)("section", {
							className: WorkflowWorkbench_module_css_default.contextProposal,
							"aria-label": "待确认修改",
							children: [renderProposalReview(), (0, react_jsx_runtime.jsx)("button", {
								onClick: () => {
									setPane("discussion");
									setOpened(true);
								},
								children: "在画布查看 ↗"
							})]
						}),
						(0, react_jsx_runtime.jsx)(WorkflowContext, {
							team,
							discussion,
							onSelect: setDiscussion,
							openExecution
						})
					]
				}),
				opened && (0, react_dom.createPortal)((0, react_jsx_runtime.jsxs)("section", {
					ref: dialog,
					className: WorkflowWorkbench_module_css_default.workbench,
					"data-editing": !!editor || !!selectedEdge || !!activeTask,
					role: "dialog",
					"aria-modal": "true",
					"aria-label": "TeamFlow 编排工作台",
					onKeyDown: (event) => {
						if ((event.key === "Delete" || event.key === "Backspace") && (selectedEdge || selectedTask) && !event.target.closest("input,textarea,select,[contenteditable=\"true\"]")) {
							event.preventDefault();
							if (selectedEdge) deleteEdge();
							else if (selectedTask) deleteNode(selectedTask);
							return;
						}
						if (event.key === "Escape") {
							if (cancelLink.current) {
								cancelLink.current();
								return;
							}
							if (editor) setEditor(void 0);
							else setOpened(false);
						}
						if (event.key === "Tab") {
							const scope = dialog.current;
							const items = [...scope?.querySelectorAll("button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary") ?? []].filter((el) => el.getClientRects().length);
							const first = items[0], last = items.at(-1);
							if (event.shiftKey && (document.activeElement === first || !scope?.contains(document.activeElement))) {
								event.preventDefault();
								last?.focus();
							} else if (!event.shiftKey && document.activeElement === last) {
								event.preventDefault();
								first?.focus();
							}
						}
					},
					children: [
						(0, react_jsx_runtime.jsxs)("header", {
							className: WorkflowWorkbench_module_css_default.header,
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: WorkflowWorkbench_module_css_default.title,
								children: [(0, react_jsx_runtime.jsx)("img", {
									src: LEAD_ART,
									alt: ""
								}), (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("strong", { children: team?.name ?? "创建团队" }), (0, react_jsx_runtime.jsx)("span", { children: team?.phase === "staged" ? "准备流程 · 确认后开始执行" : "团队工作台" })] })]
							}), (0, react_jsx_runtime.jsxs)("div", { children: [team?.phase === "staged" && (0, react_jsx_runtime.jsx)("button", {
								className: WorkflowWorkbench_module_css_default.primary,
								disabled: working || !!editor || pendingCount > 0,
								title: editor ? "请先保存或取消当前编辑" : pendingCount ? "请先处理待确认的修改" : void 0,
								onClick: () => void perform("start"),
								children: "确认并启动"
							}), (0, react_jsx_runtime.jsx)("button", {
								onClick: () => setOpened(false),
								"aria-label": "关闭编排工作台",
								children: "关闭"
							})] })]
						}),
						team && (0, react_jsx_runtime.jsx)("nav", {
							className: WorkflowWorkbench_module_css_default.paneTabs,
							"aria-label": "工作台视图",
							children: [
								"members",
								"flow",
								"discussion"
							].map((value) => (0, react_jsx_runtime.jsxs)("button", {
								"aria-pressed": pane === value,
								onClick: () => setPane(value),
								children: [value === "members" ? `成员 ${team.members.filter((m) => m.status !== "removed").length}` : value === "flow" ? "任务流程" : "修改与验收", value === "discussion" && proposal && (0, react_jsx_runtime.jsx)("i", { "aria-label": "有待确认的修改" })]
							}, value))
						}),
						pendingNotice,
						error && (0, react_jsx_runtime.jsx)("div", {
							className: WorkflowWorkbench_module_css_default.error,
							role: "alert",
							children: error
						}),
						!activeId ? (0, react_jsx_runtime.jsxs)("form", {
							className: WorkflowWorkbench_module_css_default.create,
							onSubmit: (e) => {
								e.preventDefault();
								createFlow();
							},
							children: [
								(0, react_jsx_runtime.jsx)("h2", { children: "描述目标，一起规划团队" }),
								(0, react_jsx_runtime.jsxs)("label", { children: ["团队名称", (0, react_jsx_runtime.jsx)("input", {
									required: true,
									value: name,
									onChange: (e) => setName(e.target.value)
								})] }),
								(0, react_jsx_runtime.jsxs)("label", { children: ["团队目标", (0, react_jsx_runtime.jsx)("textarea", {
									required: true,
									value: goal,
									onChange: (e) => setGoal(e.target.value)
								})] }),
								(0, react_jsx_runtime.jsx)("button", {
									className: WorkflowWorkbench_module_css_default.primary,
									disabled: working,
									children: "在 DSH 中讨论方案 ↗"
								})
							]
						}) : !team ? (0, react_jsx_runtime.jsx)("p", {
							role: "status",
							children: "正在读取团队…"
						}) : (0, react_jsx_runtime.jsxs)("div", {
							className: WorkflowWorkbench_module_css_default.columns,
							"data-approving": !!proposal && !editor && !activeTask && !selectedEdge,
							"data-pane": pane,
							"data-editing": !!editor || !!selectedEdge || !!activeTask,
							children: [
								(0, react_jsx_runtime.jsxs)("aside", {
									className: WorkflowWorkbench_module_css_default.roster,
									children: [
										(0, react_jsx_runtime.jsxs)("h3", { children: ["成员 ", (0, react_jsx_runtime.jsx)("button", {
											"aria-label": "添加成员",
											disabled: working,
											onClick: () => edit("member"),
											children: "＋ 添加"
										})] }),
										team.members.filter((m) => m.status !== "removed").map((m) => (0, react_jsx_runtime.jsxs)("article", {
											className: editor?.type === "member" && editor.id === m.name ? WorkflowWorkbench_module_css_default.selected : "",
											onClick: (event) => {
												if (!event.target.closest("button")) {
													selectDiscussion(`member:${m.name}`);
													setSelectedTask(void 0);
													edit("member", m.name);
												}
											},
											children: [
												(0, react_jsx_runtime.jsxs)("button", {
													className: WorkflowWorkbench_module_css_default.member,
													disabled: working,
													onClick: () => {
														selectDiscussion(`member:${m.name}`);
														setSelectedTask(void 0);
														edit("member", m.name);
													},
													children: [(0, react_jsx_runtime.jsx)("img", {
														src: memberArtUrl(m.name, m.role ?? ""),
														alt: ""
													}), (0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsx)("strong", { children: m.name }), (0, react_jsx_runtime.jsx)("span", { children: m.summary || m.role || "尚未填写职责概述" })] })]
												}),
												(0, react_jsx_runtime.jsx)("small", { children: m.model || "继承队长模型" }),
												(0, react_jsx_runtime.jsxs)("div", { children: [
													(0, react_jsx_runtime.jsx)("button", {
														disabled: working,
														onClick: () => prepareDiscussion(m.name),
														children: "讨论调整 ↗"
													}),
													m.id && openExecution && (0, react_jsx_runtime.jsx)("button", {
														onClick: () => {
															openExecution(m.id, team.captainSessionId);
															setOpened(false);
														},
														children: "执行对话 ↗"
													}),
													openExecution && m.previousSessionIds?.map((id, i) => (0, react_jsx_runtime.jsxs)("button", {
														onClick: () => {
															openExecution(id, team.captainSessionId);
															setOpened(false);
														},
														children: [
															"历史执行 ",
															i + 1,
															" ↗"
														]
													}, id))
												] })
											]
										}, m.name)),
										(0, react_jsx_runtime.jsx)("p", {
											className: WorkflowWorkbench_module_css_default.hint,
											children: "点击成员卡片直接编辑；讨论调整会新建独立对话，先显示成员资料。"
										})
									]
								}),
								(0, react_jsx_runtime.jsxs)("main", {
									className: WorkflowWorkbench_module_css_default.graphArea,
									children: [
										(0, react_jsx_runtime.jsxs)("nav", {
											className: WorkflowWorkbench_module_css_default.toolbar,
											children: [
												(0, react_jsx_runtime.jsx)("button", {
													disabled: working || !!editor,
													onClick: () => edit("task"),
													children: "＋ 任务"
												}),
												(0, react_jsx_runtime.jsx)("button", {
													disabled: working || !!editor,
													onClick: () => edit("check"),
													children: "＋ 人工检查"
												}),
												(0, react_jsx_runtime.jsx)("button", {
													"aria-label": "缩小画布",
													onClick: () => setZoom((value) => Math.max(.45, value - .1)),
													children: "−"
												}),
												(0, react_jsx_runtime.jsx)("button", {
													"aria-label": "放大画布",
													onClick: () => setZoom((value) => Math.min(1.5, value + .1)),
													children: "＋"
												}),
												(0, react_jsx_runtime.jsx)("button", {
													onClick: fitCanvas,
													children: "适应画布"
												}),
												(0, react_jsx_runtime.jsx)("span", {
													role: link || taskEditing ? "status" : void 0,
													children: link ? link.issue ?? (link.to ? "已吸附到输入端 · 松开连接" : "靠近下一节点以连接 · Esc 取消") : "拖动节点右侧中心连接柄建立交接；点击节点编辑属性、点击连线查看；Delete 删除选中对象"
												})
											]
										}),
										reviewNotice,
										(0, react_jsx_runtime.jsx)("div", {
											className: WorkflowWorkbench_module_css_default.canvas,
											ref: canvas,
											onPointerDown: (event) => {
												if (event.target === event.currentTarget || event.target.classList.contains(WorkflowWorkbench_module_css_default.plane)) {
													setSelectedEdge(void 0);
													setSelectedTask(void 0);
													setEditor(void 0);
												}
											},
											children: (0, react_jsx_runtime.jsxs)("div", {
												className: WorkflowWorkbench_module_css_default.plane,
												style: {
													width: graphWidth,
													height: graphHeight,
													zoom
												},
												children: [
													(0, react_jsx_runtime.jsxs)("svg", {
														className: WorkflowWorkbench_module_css_default.edges,
														"aria-label": "任务交接连线",
														children: [
															(0, react_jsx_runtime.jsx)("defs", { children: (0, react_jsx_runtime.jsx)("marker", {
																id: "workflow-arrow",
																markerWidth: "8",
																markerHeight: "8",
																refX: "7",
																refY: "4",
																orient: "auto",
																children: (0, react_jsx_runtime.jsx)("path", {
																	d: "M0,0 L8,4 L0,8",
																	fill: "currentColor"
																})
															}) }),
															team.tasks.flatMap((t) => t.dependencies.map((dep) => {
																const a = pos(dep), b = pos(t.id);
																const path = `M${a.x + 225},${a.y + 55} C${a.x + 260},${a.y + 55} ${b.x - 35},${b.y + 55} ${b.x},${b.y + 55}`;
																return (0, react_jsx_runtime.jsxs)("g", {
																	"data-selected": selectedEdge?.from === dep && selectedEdge.to === t.id,
																	className: WorkflowWorkbench_module_css_default.edge,
																	children: [(0, react_jsx_runtime.jsx)("path", {
																		d: path,
																		markerEnd: "url(#workflow-arrow)"
																	}), (0, react_jsx_runtime.jsx)("path", {
																		className: WorkflowWorkbench_module_css_default.edgeHit,
																		d: path,
																		role: "button",
																		tabIndex: 0,
																		"aria-label": `交接：${team.tasks.find((task) => task.id === dep)?.subject ?? dep} → ${t.subject}`,
																		"aria-pressed": selectedEdge?.from === dep && selectedEdge.to === t.id,
																		onClick: () => {
																			setSelectedEdge({
																				from: dep,
																				to: t.id
																			});
																			setSelectedTask(void 0);
																			setEditor(void 0);
																			setDiscussion("graph");
																		},
																		onKeyDown: (event) => {
																			if (event.key === "Enter" || event.key === " ") {
																				event.preventDefault();
																				setSelectedEdge({
																					from: dep,
																					to: t.id
																				});
																				setSelectedTask(void 0);
																			}
																		}
																	})]
																}, `${dep}-${t.id}`);
															})),
															link && (0, react_jsx_runtime.jsx)("path", { d: `M${pos(link.from).x + 225},${pos(link.from).y + 55} C${pos(link.from).x + 280},${pos(link.from).y + 55} ${link.x - 55},${link.y} ${link.x},${link.y}` })
														]
													}),
													team.tasks.map((task) => {
														const p = pos(task.id);
														return (0, react_jsx_runtime.jsxs)("article", {
															"data-member-match": !!editor?.id && editor.type === "member" && task.assignee === editor.id || void 0,
															"data-connection": link?.to === task.id ? link.issue ? "invalid" : "valid" : void 0,
															"data-review-ready": !!task.checkpoint && data.ready.includes(task.id),
															className: `${WorkflowWorkbench_module_css_default.node} ${task.checkpoint ? WorkflowWorkbench_module_css_default.checkpoint : ""} ${selectedTask === task.id ? WorkflowWorkbench_module_css_default.selected : ""}`,
															style: {
																left: p.x,
																top: p.y
															},
															onPointerDown: (event) => beginNodeDrag(event, task),
															onClick: (event) => {
																if (working || event.target.closest("[data-connection-handle]")) return;
																if (suppressNodeClick.current) {
																	suppressNodeClick.current = false;
																	return;
																}
																setSelectedEdge(void 0);
																setSelectedTask(task.id);
																if (task.status === "pending" && (task.attempt ?? 0) === 0 && !task.checkpoint?.decision) edit(task.checkpoint ? "check" : "task", task.id);
																else setEditor(void 0);
															},
															children: [
																(0, react_jsx_runtime.jsxs)("div", {
																	className: WorkflowWorkbench_module_css_default.drag,
																	children: [
																		"⠿ ",
																		task.checkpoint ? "◇ 人工验收" : "执行任务",
																		" · ",
																		task.id
																	]
																}),
																(0, react_jsx_runtime.jsxs)("button", {
																	className: WorkflowWorkbench_module_css_default.nodeBody,
																	children: [
																		(0, react_jsx_runtime.jsx)("strong", { children: task.subject }),
																		(0, react_jsx_runtime.jsxs)("span", {
																			className: WorkflowWorkbench_module_css_default.taskOwner,
																			children: [(0, react_jsx_runtime.jsx)("img", {
																				src: task.checkpoint ? REVIEW_ART : memberArtUrl(task.assignee ?? "", team.members.find((m) => m.name === task.assignee)?.role ?? ""),
																				alt: ""
																			}), task.checkpoint ? "验收 Agent 与你" : task.assignee || "自动分配成员"]
																		}),
																		(0, react_jsx_runtime.jsx)("small", {
																			"data-ready": data.ready.includes(task.id),
																			children: taskStatus(task, data.ready)
																		})
																	]
																}),
																(0, react_jsx_runtime.jsx)("button", {
																	className: `${WorkflowWorkbench_module_css_default.port} ${WorkflowWorkbench_module_css_default.input}`,
																	"data-connection-handle": true,
																	"data-input-id": task.id,
																	"aria-label": `${task.subject} 输入端`
																}),
																(0, react_jsx_runtime.jsx)("button", {
																	className: `${WorkflowWorkbench_module_css_default.port} ${WorkflowWorkbench_module_css_default.output}`,
																	"data-connection-handle": true,
																	"aria-label": `${task.subject} 输出端`,
																	disabled: working || taskEditing && !editor?.id,
																	title: "从这里拖出连接线",
																	onPointerDown: (event) => {
																		if (event.button !== 0) return;
																		event.preventDefault();
																		const target = event.currentTarget;
																		target.setPointerCapture(event.pointerId);
																		const update = (move) => {
																			const at = point(move), to = connectionTarget(team.tasks, pos, at, task.id);
																			const issue = to ? connectionIssue(team.tasks, task.id, to.id) : void 0;
																			const end = to && !issue ? {
																				x: pos(to.id).x,
																				y: pos(to.id).y + 55
																			} : at;
																			setLink({
																				from: task.id,
																				...end,
																				to: to?.id,
																				issue
																			});
																			return {
																				to,
																				issue
																			};
																		};
																		const cleanup = () => {
																			target.onpointermove = null;
																			target.onpointerup = null;
																			target.onpointercancel = null;
																			if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
																			cancelLink.current = void 0;
																			setLink(void 0);
																		};
																		cancelLink.current = cleanup;
																		update(event);
																		target.onpointermove = (move) => {
																			update(move);
																		};
																		target.onpointerup = (up) => {
																			const { to, issue } = update(up);
																			cleanup();
																			if (issue) setError(issue);
																			if (to && !issue) saveEdit([{
																				action: "update_task",
																				id: to.id,
																				dependencies: [...to.dependencies, task.id]
																			}], `连接 ${task.subject} → ${to.subject}`);
																		};
																		target.onpointercancel = cleanup;
																	}
																})
															]
														}, task.id);
													}),
													taskEditing && !editor?.id && (0, react_jsx_runtime.jsxs)("article", {
														className: `${WorkflowWorkbench_module_css_default.node} ${WorkflowWorkbench_module_css_default.draftNode}`,
														style: {
															left: draftPosition.x,
															top: draftPosition.y
														},
														children: [(0, react_jsx_runtime.jsx)("div", {
															className: WorkflowWorkbench_module_css_default.drag,
															children: "草稿 · 确认后加入流程"
														}), (0, react_jsx_runtime.jsxs)("div", {
															className: WorkflowWorkbench_module_css_default.nodeBody,
															children: [
																(0, react_jsx_runtime.jsx)("strong", { children: draft["subject"] || (editor?.type === "check" ? "新人工检查" : "新任务") }),
																(0, react_jsx_runtime.jsx)("span", { children: editor?.type === "check" ? "你与独立验收 Agent" : draft["assignee"] || "待指定 Agent" }),
																(0, react_jsx_runtime.jsx)("small", { children: "尚未应用" })
															]
														})]
													}),
													!team.tasks.length && !editor && (0, react_jsx_runtime.jsx)("p", {
														className: WorkflowWorkbench_module_css_default.empty,
														children: "添加任务或人工检查，或让 AI 根据目标提出流程方案。"
													})
												]
											})
										})
									]
								}),
								selectedEdge && (0, react_jsx_runtime.jsxs)("aside", {
									className: WorkflowWorkbench_module_css_default.editor,
									"aria-label": "交接详情",
									children: [
										(0, react_jsx_runtime.jsxs)("strong", { children: [
											team.tasks.find((task) => task.id === selectedEdge.from)?.subject,
											" → ",
											team.tasks.find((task) => task.id === selectedEdge.to)?.subject
										] }),
										(0, react_jsx_runtime.jsx)("p", { children: "上游完成后，下游才开始。按 Delete 删除此连线。" }),
										(0, react_jsx_runtime.jsx)("button", {
											disabled: working,
											onClick: () => void deleteEdge(),
											children: "删除连线"
										})
									]
								}),
								activeTask && !editor && !selectedEdge && (0, react_jsx_runtime.jsxs)("aside", {
									className: WorkflowWorkbench_module_css_default.editor,
									children: [
										(0, react_jsx_runtime.jsx)("strong", { children: activeTask.subject }),
										(0, react_jsx_runtime.jsx)("p", { children: activeTask.description || "暂无任务说明" }),
										(0, react_jsx_runtime.jsx)("div", { children: !activeTask.checkpoint && ![
											"completed",
											"failed",
											"cancelled"
										].includes(activeTask.status) && (0, react_jsx_runtime.jsx)("button", {
											disabled: working,
											onClick: () => void perform(activeTask.workflowPaused ? "resume_task" : "stop_task", { taskId: activeTask.id }),
											children: activeTask.workflowPaused ? "继续执行" : "停止任务以编辑"
										}) })
									]
								}),
								!editor && !selectedEdge && !activeTask && (0, react_jsx_runtime.jsxs)("aside", {
									className: WorkflowWorkbench_module_css_default.discussion,
									children: [
										(0, react_jsx_runtime.jsxs)("header", { children: [(0, react_jsx_runtime.jsx)("img", {
											src: reviewTask ? REVIEW_ART : member ? memberArtUrl(member.name, member.role ?? "") : LEAD_ART,
											alt: ""
										}), (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("h3", { children: reviewTask ? `验收 · ${reviewTask.subject}` : member ? `成员职责 · ${member.name}` : "流程修改" }), (0, react_jsx_runtime.jsx)("small", { children: reviewTask ? "一起检查成果，由你决定是否通过" : "讨论不影响执行，修改确认后生效" })] })] }),
										(0, react_jsx_runtime.jsxs)("div", {
											className: WorkflowWorkbench_module_css_default.messages,
											children: [
												(0, react_jsx_runtime.jsx)("p", {
													className: WorkflowWorkbench_module_css_default.hint,
													children: reviewTask ? "在原生验收对话中共同检查成果，回到这里确认验收决定。" : member ? "在这里与独立配置顾问讨论；队长对话保持独立。" : "在 DSH 原生对话中讨论团队与流程，修改方案会显示在这里。"
												}),
												embeddedDiscussion === discussion && activeId ? (0, react_jsx_runtime.jsx)(EmbeddedDiscussion, {
													sessionId,
													teamId: activeId,
													discussion
												}, `${activeId}:${discussion}:${conversation?.native?.sessionId}`) : (0, react_jsx_runtime.jsxs)("button", {
													className: WorkflowWorkbench_module_css_default.primary,
													disabled: working,
													onClick: () => member ? prepareDiscussion(member.name) : void startEmbedded(discussion),
													children: [
														"在此处",
														conversation?.native ? "继续" : "开始",
														"讨论"
													]
												}),
												embeddedDiscussion === discussion && conversation?.native && openConversation && (0, react_jsx_runtime.jsx)("button", {
													disabled: working,
													onClick: () => void openDiscussion(discussion),
													children: "打开完整 DSH 对话 ↗"
												}),
												(0, react_jsx_runtime.jsxs)("details", { children: [(0, react_jsx_runtime.jsx)("summary", { children: "查看当前资料" }), (0, react_jsx_runtime.jsx)(WorkflowContext, {
													team,
													discussion,
													onSelect: (key) => {
														selectDiscussion(key);
														if (key.startsWith("member:")) edit("member", key.slice(7));
													},
													openExecution
												})] }),
												conversation?.materials && (0, react_jsx_runtime.jsxs)("details", {
													open: true,
													children: [(0, react_jsx_runtime.jsx)("summary", { children: "本轮验收材料与证据" }), (0, react_jsx_runtime.jsx)(ReviewMaterials, { text: conversation.materials })]
												}),
												data.busy.includes(discussion) && (0, react_jsx_runtime.jsx)("p", {
													role: "status",
													children: "原生对话正在整理方案…"
												})
											]
										}),
										proposal && (0, react_jsx_runtime.jsx)("section", {
											className: WorkflowWorkbench_module_css_default.proposal,
											children: renderProposalReview()
										}),
										reviewTask && conversation?.evidence && conversation.materialsRound === reviewTask.checkpoint?.round && data.ready.includes(reviewTask.id) && !reviewTask.checkpoint?.decision && (0, react_jsx_runtime.jsxs)("div", {
											className: WorkflowWorkbench_module_css_default.decisions,
											children: [(0, react_jsx_runtime.jsx)("button", {
												className: WorkflowWorkbench_module_css_default.primary,
												disabled: working,
												onClick: () => void perform("review", {
													taskId: reviewTask.id,
													evidence: conversation.evidence,
													decision: "approve",
													note
												}).then((ok) => {
													if (ok) setNote("");
												}),
												children: "通过验收"
											}), (0, react_jsx_runtime.jsx)("button", {
												disabled: working,
												onClick: () => void perform("review", {
													taskId: reviewTask.id,
													evidence: conversation.evidence,
													decision: "reject",
													note
												}).then((ok) => {
													if (ok) {
														setNote("");
														startEmbedded(discussion);
													}
												}),
												children: "退回并讨论返工"
											})]
										}),
										reviewTask?.checkpoint?.decision === "reject" && (0, react_jsx_runtime.jsx)("p", {
											className: WorkflowWorkbench_module_css_default.notice,
											children: "已拒绝，下游保持等待。请讨论返工对象并确认新方案。"
										}),
										reviewTask && (0, react_jsx_runtime.jsxs)("div", {
											className: WorkflowWorkbench_module_css_default.composer,
											children: [(0, react_jsx_runtime.jsxs)("label", { children: ["验收意见（随决定保存）", (0, react_jsx_runtime.jsx)("textarea", {
												"aria-label": "验收意见",
												value: note,
												onChange: (e) => setNote(e.target.value),
												placeholder: "记录通过或退回的原因…"
											})] }), (0, react_jsx_runtime.jsx)("button", {
												disabled: working || !data.ready.includes(reviewTask.id),
												onClick: () => void perform("materials"),
												children: "刷新验收材料"
											})]
										}),
										!member && !data.currentDiscussion && (0, react_jsx_runtime.jsx)("button", {
											disabled: working || data.busy.includes(discussion),
											onClick: () => void startEmbedded(discussion, activeId, true),
											children: "新建独立讨论"
										})
									]
								}),
								editor && (0, react_jsx_runtime.jsxs)("form", {
									"data-workflow-editor": true,
									className: WorkflowWorkbench_module_css_default.editor,
									onSubmit: (event) => {
										event.preventDefault();
										try {
											const route = draft["routeChanged"] ? {
												provider: draft["provider"],
												model: draft["model"],
												reasoningEffort: draft["reasoningEffort"] || "default"
											} : {};
											saveEdit(editor.type === "member" ? [editor.id ? {
												action: "update_member",
												name: editor.id,
												summary: draft["summary"],
												role: draft["role"],
												executionPrompt: draft["executionPrompt"],
												...route
											} : {
												action: "add_member",
												name: draft["name"] ?? "",
												summary: draft["summary"] ?? "",
												role: draft["role"],
												executionPrompt: draft["executionPrompt"],
												...route
											}] : [editor.id ? {
												action: "update_task",
												id: editor.id,
												subject: draft["subject"] ?? "",
												description: draft["description"],
												assignee: editor.type === "check" ? void 0 : draft["assignee"]
											} : {
												action: "add_task",
												checkpoint: editor.type === "check",
												subject: draft["subject"] ?? "",
												description: draft["description"],
												assignee: editor.type === "check" ? void 0 : draft["assignee"],
												dependencies: []
											}], editor.type === "member" ? "调整团队成员" : "调整任务", true);
										} catch (error) {
											setError(String(error));
										}
									},
									children: [
										(0, react_jsx_runtime.jsxs)("h3", { children: [editor.id ? "编辑" : "添加", editor.type === "member" ? "成员" : editor.type === "check" ? "人工检查" : "任务"] }),
										editor.type === "member" ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
											field("name", "名称"),
											(0, react_jsx_runtime.jsxs)("div", {
												className: WorkflowWorkbench_module_css_default.memberModelSettings,
												children: [(0, react_jsx_runtime.jsx)("strong", { children: "模型与 Thinking" }), modelDirectory && t ? (0, react_jsx_runtime.jsx)(StagedModelPicker, {
													directory: modelDirectory,
													t,
													provider: draft["provider"] ?? "",
													model: draft["model"] ?? "",
													reasoningEffort: draft["reasoningEffort"] ?? "",
													busy: working,
													onChange: (selection) => setDraft((prev) => ({
														...prev,
														...selection,
														routeChanged: "yes"
													}))
												}) : (0, react_jsx_runtime.jsx)("p", {
													className: WorkflowWorkbench_module_css_default.hint,
													children: "模型目录暂不可用，请在 DSH 团队活动页面打开编辑。"
												})]
											}),
											field("summary", "Summary · 功能概述", true),
											field("role", "长期职责", true),
											field("executionPrompt", "执行指令 / PE", true)
										] }) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
											field("subject", "任务名称"),
											field("description", "任务要求 / 验收要求", true),
											editor.type !== "check" && (0, react_jsx_runtime.jsxs)("label", { children: ["执行 Agent", (0, react_jsx_runtime.jsxs)("select", {
												value: draft["assignee"] ?? "",
												onChange: (e) => setDraft({
													...draft,
													assignee: e.target.value
												}),
												children: [(0, react_jsx_runtime.jsx)("option", {
													value: "",
													children: "由空闲成员领取"
												}), team.members.filter((m) => m.status !== "removed").map((m) => (0, react_jsx_runtime.jsx)("option", { children: m.name }, m.name))]
											})] }),
											(0, react_jsx_runtime.jsx)("p", {
												className: WorkflowWorkbench_module_css_default.hint,
												children: "保存节点后，直接拖动画布中的连接柄建立关系。点击连线可查看两端并删除。"
											})
										] }),
										(0, react_jsx_runtime.jsxs)("footer", { children: [
											(0, react_jsx_runtime.jsx)("button", {
												className: WorkflowWorkbench_module_css_default.primary,
												disabled: working,
												children: "保存"
											}),
											editor.id && editor.type === "task" && team.tasks.find((task) => task.id === editor.id)?.workflowPaused && (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												disabled: working,
												onClick: () => void perform("resume_task", { taskId: editor.id }).then((ok) => {
													if (ok) setEditor(void 0);
												}),
												children: "继续执行"
											}),
											editor.id && editor.type !== "member" && (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												disabled: working,
												onClick: () => void deleteNode(editor.id),
												children: "删除节点"
											}),
											editor.type === "check" && editor.id && data.ready.includes(editor.id) && (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												disabled: working,
												onClick: () => void openReview(editor.id),
												children: "开始验收 ↗"
											}),
											(0, react_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setEditor(void 0),
												children: "取消"
											}),
											editor.type === "member" && editor.id && (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												disabled: working,
												onClick: () => void saveEdit([{
													action: "remove_member",
													name: editor.id
												}], `移除 ${editor.id}`, true),
												children: "移除成员"
											})
										] })
									]
								}, `${editor.type}:${editor.id ?? "new"}`)
							]
						})
					]
				}), document.body)
			] });
		}
		//#endregion
		//#region lib/client/QuickMemberEditor.js
		/** Inline member configuration in the activity list, saved via the same workflow API as the canvas. */
		async function request(payload) {
			const response = await fetch("/plugins/dsh-agent-teams/workflow", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(payload)
			});
			const value = await response.json();
			if (!response.ok) throw new Error(value.error ?? `HTTP ${response.status}`);
			return value;
		}
		function QuickMemberEditor({ team, member, directory, t, close }) {
			const [base, setBase] = (0, react.useState)("");
			const [role, setRole] = (0, react.useState)(member.role);
			const [route, setRoute] = (0, react.useState)({
				provider: "",
				model: "",
				reasoningEffort: ""
			});
			const [routeChanged, setRouteChanged] = (0, react.useState)(false);
			const [busy, setBusy] = (0, react.useState)(true);
			const [error, setError] = (0, react.useState)("");
			(0, react.useEffect)(() => {
				let live = true;
				setBusy(true);
				setError("");
				request({
					action: "state",
					sessionId: team.captainSessionId,
					teamId: team.teamId
				}).then((result) => {
					const current = result.team.members.find((item) => item.name === member.name);
					if (!current) throw new Error("成员不存在");
					if (live) {
						setBase(result.base);
						setRole(current.role ?? "");
						setRoute({
							provider: current.provider ?? "",
							model: current.model ?? "",
							reasoningEffort: current.reasoningEffort ?? ""
						});
						setRouteChanged(false);
					}
				}).catch((err) => {
					if (live) setError(err instanceof Error ? err.message : String(err));
				}).finally(() => {
					if (live) setBusy(false);
				});
				return () => {
					live = false;
				};
			}, [
				team.captainSessionId,
				team.teamId,
				member.name
			]);
			async function save() {
				setBusy(true);
				setError("");
				try {
					await request({
						action: "edit",
						sessionId: team.captainSessionId,
						teamId: team.teamId,
						title: `调整 ${member.name} 的配置`,
						base,
						operations: [{
							action: "update_member",
							name: member.name,
							role,
							...routeChanged ? {
								...route,
								reasoningEffort: route.reasoningEffort || "default"
							} : {}
						}]
					});
					close();
				} catch (err) {
					setError(err instanceof Error ? err.message : String(err));
				} finally {
					setBusy(false);
				}
			}
			return (0, react_jsx_runtime.jsxs)("form", {
				className: ActivityPanel_module_css_default.quickMember,
				"aria-label": `配置 ${member.name}`,
				onSubmit: (event) => {
					event.preventDefault();
					save();
				},
				children: [
					(0, react_jsx_runtime.jsxs)("strong", { children: ["配置 · ", member.name] }),
					(0, react_jsx_runtime.jsx)(StagedModelPicker, {
						directory,
						t,
						...route,
						busy: busy || !base,
						onChange: (value) => {
							setRoute(value);
							setRouteChanged(true);
						}
					}),
					(0, react_jsx_runtime.jsxs)("label", { children: ["职责", (0, react_jsx_runtime.jsx)("textarea", {
						value: role,
						disabled: busy || !base,
						onChange: (event) => setRole(event.target.value)
					})] }),
					error && (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						children: error
					}),
					(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("button", {
						type: "submit",
						disabled: busy || !base,
						children: "保存"
					}), (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: busy,
						onClick: close,
						children: "取消"
					})] })
				]
			});
		}
		//#endregion
		//#region lib/client/WorkflowHistory.js
		/** History comes from activity snapshots, never from the mutable workflow API. */
		function WorkflowHistory({ name, children }) {
			const dialog = (0, react.useRef)(null);
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: `${WorkflowWorkbench_module_css_default.entry} ${WorkflowWorkbench_module_css_default.launcher}`,
				"aria-haspopup": "dialog",
				onClick: () => dialog.current?.showModal(),
				children: [(0, react_jsx_runtime.jsxs)("strong", { children: ["团队与流程 ", (0, react_jsx_runtime.jsx)("span", {
					"aria-hidden": true,
					children: "↗"
				})] }), (0, react_jsx_runtime.jsxs)("span", { children: [name, " · 历史记录，只读"] })]
			}), (0, react_dom.createPortal)((0, react_jsx_runtime.jsxs)("dialog", {
				ref: dialog,
				className: `${WorkflowWorkbench_module_css_default.entry} ${WorkflowWorkbench_module_css_default.historyDialog}`,
				"aria-label": `${name} · 团队与流程（只读）`,
				children: [(0, react_jsx_runtime.jsxs)("header", { children: [(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("strong", { children: name }), (0, react_jsx_runtime.jsx)("p", { children: "历史记录 · 只读" })] }), (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					autoFocus: true,
					onClick: () => dialog.current?.close(),
					children: "关闭"
				})] }), children]
			}), document.body)] });
		}
		//#endregion
		//#region lib/client/icons.js
		/** Plugin-owned icons avoid depending on the host's generated design-export names. */
		const stroke = {
			fill: "none",
			stroke: "currentColor",
			strokeWidth: 1.5,
			strokeLinecap: "round",
			strokeLinejoin: "round"
		};
		function IconBranchOutline16() {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				...stroke,
				children: [
					(0, react_jsx_runtime.jsx)("circle", {
						cx: "4",
						cy: "3",
						r: "1.5"
					}),
					(0, react_jsx_runtime.jsx)("circle", {
						cx: "12",
						cy: "4",
						r: "1.5"
					}),
					(0, react_jsx_runtime.jsx)("circle", {
						cx: "4",
						cy: "13",
						r: "1.5"
					}),
					(0, react_jsx_runtime.jsx)("path", { d: "M4 4.5v7M4 9h3a5 5 0 0 0 5-3.5" })
				]
			});
		}
		function IconChevronDownOutline14() {
			return (0, react_jsx_runtime.jsx)("svg", {
				width: "14",
				height: "14",
				viewBox: "0 0 14 14",
				"aria-hidden": "true",
				...stroke,
				children: (0, react_jsx_runtime.jsx)("path", { d: "m3 5 4 4 4-4" })
			});
		}
		function IconPanelLeftOutline16() {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				...stroke,
				children: [(0, react_jsx_runtime.jsx)("rect", {
					x: "2",
					y: "2.5",
					width: "12",
					height: "11",
					rx: "2"
				}), (0, react_jsx_runtime.jsx)("path", { d: "M6 2.5v11" })]
			});
		}
		function IconStopFill16() {
			return (0, react_jsx_runtime.jsx)("svg", {
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				children: (0, react_jsx_runtime.jsx)("rect", {
					x: "4",
					y: "4",
					width: "8",
					height: "8",
					rx: "1",
					fill: "currentColor"
				})
			});
		}
		function IconWarningOutline16() {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				...stroke,
				children: [(0, react_jsx_runtime.jsx)("path", { d: "m7 2-5.5 10a1 1 0 0 0 1 1.5h11a1 1 0 0 0 1-1.5L9 2a1.1 1.1 0 0 0-2 0Z" }), (0, react_jsx_runtime.jsx)("path", { d: "M8 6v3m0 2v.1" })]
			});
		}
		//#endregion
		//#region lib/client/session-navigation.js
		/** Version-tolerant navigation into durable AgentTeams member transcripts. */
		/** Newer sessions retain view ownership instead of publishing list.current. */
		function currentSessionId(state) {
			if ("current" in state) return state.current;
			return Object.values(state.byId).find((row) => (row.retainedBy?.mainView ?? 0) > 0)?.id;
		}
		/** Independent workflow discussions are ordinary sessions, never captain subagents. */
		function openWorkflowConversation(openMember, sessionId) {
			return openMember(sessionId, sessionId);
		}
		/**
		* Open one member's persisted transcript.
		*
		* Harness rc.8 intentionally removed cold subagents from the ordinary session
		* list. They must first be rediscovered in their parent's catalog, then opened
		* with the exact parent/child/mode address. Older runtimes have only `open()`;
		* the fallback preserves ordinary-session navigation. New layouts also select
		* the Conversation panel and cancel catalog refreshes superseded by navigation.
		*/
		async function openAgentTeamMember(sessions, parentSessionId, childSessionId, layout, workspace) {
			if (parentSessionId === childSessionId) {
				if (workspace) workspace.openSession(childSessionId);
				else if (sessions.open) sessions.open(childSessionId);
				else throw new Error("Harness does not expose session navigation");
				layout?.selectPanel?.(null);
				return "session";
			}
			if (sessions.open === void 0 && workspace !== void 0) {
				workspace.openSession({
					parentSessionId,
					childSessionId,
					mode: "continuable"
				});
				return "subagent";
			}
			const navigation = layout?.beginNavigation?.();
			if (sessions.openSubagent === void 0 || sessions.refreshSubagents === void 0) {
				if (sessions.open === void 0) throw new Error("Harness does not expose session navigation");
				sessions.open(childSessionId);
				layout?.selectPanel?.(null);
				return "session";
			}
			await sessions.refreshSubagents(parentSessionId);
			if (navigation?.aborted) return "cancelled";
			const retained = sessions.subagentAddress?.(childSessionId);
			sessions.openSubagent(retained?.parentSessionId === parentSessionId ? retained : {
				parentSessionId,
				childSessionId,
				mode: "continuable"
			});
			layout?.selectPanel?.(null);
			return "subagent";
		}
		/** Compact `provider/model` route, or just the model when the provider is absent. */
		function memberRouteLabel(member) {
			if (member === void 0) return "";
			const provider = member.provider?.trim() ?? "";
			const model = member.model?.trim() ?? "";
			if (provider !== "" && model !== "") return `${provider}/${model}`;
			return model;
		}
		/**
		* Compact route shown on a running task. Prefer the task's own snapshot
		* field; fall back to the assignee member when older hosts omit it.
		*/
		function taskModelLabel(task, members) {
			const direct = task.model?.trim() ?? "";
			if (direct !== "") return direct;
			return memberRouteLabel(members.find((candidate) => candidate.name === task.assignee));
		}
		/** Short model id for tight DAG/chip surfaces (`openai/gpt-5.6-sol` → `gpt-5.6-sol`). */
		function compactModelLabel(route) {
			const trimmed = route.trim();
			if (trimmed === "") return "";
			const slash = trimmed.lastIndexOf("/");
			return slash === -1 ? trimmed : trimmed.slice(slash + 1);
		}
		/**
		* Latest terminal-task `updatedAt` owned by one member.
		* @param memberName - member whose owned tasks are scanned.
		* @param tasks - team tasks carrying durable `updatedAt` stamps.
		* @returns the newest terminal stamp, or undefined when the member owns none.
		*/
		function memberFinishedAt(memberName, tasks) {
			let latest;
			for (const task of tasks) {
				if (task.assignee !== memberName) continue;
				if (task.status !== "completed" && task.status !== "failed" && task.status !== "cancelled") continue;
				const stamp = task.updatedAt;
				if (typeof stamp !== "number" || !Number.isFinite(stamp)) continue;
				if (latest === void 0 || stamp > latest) latest = stamp;
			}
			return latest;
		}
		/** Whether a member still has live work (running activity or an open task). */
		function memberIsRunning(member, tasks) {
			if (member.activity === "working" || member.status === "working") return true;
			return tasks.some((task) => task.assignee === member.name && (task.status === "pending" || task.status === "claimed" || task.status === "in_progress"));
		}
		/**
		* Order the delegation member list for issue #192.
		*
		* Running members keep their incoming relative order and come first; finished
		* members follow sorted by finish time, newest first. Members without a
		* derivable finish time keep their incoming relative order after the stamped
		* ones, so an older host that omits stamps never reorders them randomly.
		* @param members - delegation roster in snapshot order.
		* @param tasks - team tasks carrying durable `updatedAt` stamps.
		* @returns the members in display order.
		*/
		function orderDelegationMembers(members, tasks) {
			const running = [];
			const finishedStamped = [];
			const finishedUnstamped = [];
			members.forEach((member, index) => {
				if (memberIsRunning(member, tasks)) {
					running.push({
						member,
						index
					});
					return;
				}
				const finishedAt = memberFinishedAt(member.name, tasks);
				if (finishedAt === void 0) finishedUnstamped.push({
					member,
					index
				});
				else finishedStamped.push({
					member,
					index,
					finishedAt
				});
			});
			finishedStamped.sort((left, right) => right.finishedAt - left.finishedAt || left.index - right.index);
			return [
				...running,
				...finishedStamped,
				...finishedUnstamped
			].map((entry) => entry.member);
		}
		/** Whether the captain chat should keep showing the in-progress banner. */
		function teamIsActive(team) {
			if (team.halted === true || team.phase === "staged") return false;
			if (team.members.some((member) => member.activity === "working" || member.status === "working")) return true;
			if (team.tasks.some((task) => task.status === "pending" || task.status === "claimed" || task.status === "in_progress")) return true;
			return team.members.length > 0 && team.tasks.length === 0;
		}
		/** Use a fill-width grid when the task graph has no real dependency edges. */
		function usesParallelTaskGrid(tasks) {
			if (tasks.length === 0) return false;
			const taskIds = new Set(tasks.map((task) => task.id));
			return tasks.every((task) => task.dependencies.every((dependency) => !taskIds.has(dependency)));
		}
		/**
		* Whether an expanded activity panel still belongs to the current session.
		*
		* The panel is mounted in the root-scoped shell overlay, so React does not
		* remount it when the conversation route changes. Ownership keeps an expanded
		* panel from leaking onto the new-session screen (or another conversation)
		* while its local open state is being reset.
		*/
		function activityPanelExpandedForSession(open, owner, current) {
			return open && owner !== void 0 && owner === current;
		}
		/**
		* Auto-expand only for live teams that appear after the current session's
		* initial restore pass. Replayed cards, archived teams, and live teams restored
		* while reopening a conversation must remain behind the collapsed badge.
		*/
		function activityPanelShouldAutoExpand({ alreadyAutoOpened, pageSettled, restoreComplete, previousLiveTeamIds, currentLiveTeamIds }) {
			return !alreadyAutoOpened && pageSettled && restoreComplete && currentLiveTeamIds.some((teamId) => !previousLiveTeamIds.has(teamId));
		}
		/**
		* Resolve the task whose dependency chain should be highlighted.
		*
		* A pinned task is an explicit user choice. Keyboard focus takes precedence
		* over delayed pointer intent so an older hover timer cannot steal the active
		* chain from someone navigating the task map with the keyboard.
		*/
		function dependencyFocusTaskId(pinnedTaskId, keyboardTaskId, hoverTaskId) {
			return pinnedTaskId ?? keyboardTaskId ?? hoverTaskId;
		}
		/** Group tasks by their precomputed dependency depth. */
		function taskStages(tasks) {
			const byDepth = /* @__PURE__ */ new Map();
			for (const task of tasks) {
				const depth = Number.isFinite(task.depth) ? Math.max(0, Math.floor(task.depth)) : 0;
				const stage = byDepth.get(depth) ?? [];
				stage.push(task);
				byDepth.set(depth, stage);
			}
			return [...byDepth.entries()].sort(([left], [right]) => left - right).map(([depth, stageTasks]) => ({
				depth,
				tasks: stageTasks.slice().sort((left, right) => left.id.localeCompare(right.id, "en", { numeric: true }))
			}));
		}
		/**
		* Lay tasks out as the reference panel's compact left-to-right DAG.
		*
		* Columns are dependency-depth stages. Rows are stable task-id order within
		* each stage. Edges use cubic curves so fan-in remains readable without
		* turning every task into a large card.
		*/
		function compactDagLayout(tasks, dimensions) {
			const nodeWidth = dimensions?.nodeWidth ?? 92;
			const nodeHeight = dimensions?.nodeHeight ?? 30;
			const columnGap = dimensions?.columnGap ?? 26;
			const rowGap = dimensions?.rowGap ?? 8;
			const stages = taskStages(tasks);
			const positions = /* @__PURE__ */ new Map();
			const nodes = [];
			for (const [column, stage] of stages.entries()) for (const [row, task] of stage.tasks.entries()) {
				const x = column * (nodeWidth + columnGap);
				const y = row * (nodeHeight + rowGap);
				positions.set(task.id, {
					x,
					y
				});
				nodes.push({
					task,
					x,
					y
				});
			}
			const edges = [];
			for (const task of tasks) {
				const target = positions.get(task.id);
				if (target === void 0) continue;
				for (const dependency of task.dependencies) {
					const source = positions.get(dependency);
					if (source === void 0) continue;
					const x1 = source.x + nodeWidth;
					const y1 = source.y + nodeHeight / 2;
					const x2 = target.x;
					const y2 = target.y + nodeHeight / 2;
					edges.push({
						from: dependency,
						to: task.id,
						path: `M${x1} ${y1}C${x1 + 14} ${y1},${x2 - 14} ${y2},${x2} ${y2}`
					});
				}
			}
			const rows = Math.max(1, ...stages.map((stage) => stage.tasks.length));
			return {
				width: stages.length === 0 ? 0 : stages.length * nodeWidth + (stages.length - 1) * columnGap,
				height: stages.length === 0 ? 0 : rows * nodeHeight + (rows - 1) * rowGap,
				nodes,
				edges
			};
		}
		/**
		* Return the complete upstream/downstream chain around one task.
		*
		* Traversal uses both dependency directions and remains cycle-safe, so the UI
		* can highlight every handoff related to the focused task even if malformed
		* durable data contains a cycle.
		*/
		function relatedTaskIds(taskId, tasks) {
			const byId = new Map(tasks.map((task) => [task.id, task]));
			if (!byId.has(taskId)) return /* @__PURE__ */ new Set();
			const dependents = /* @__PURE__ */ new Map();
			for (const task of tasks) for (const dependency of task.dependencies) {
				const targets = dependents.get(dependency) ?? [];
				targets.push(task.id);
				dependents.set(dependency, targets);
			}
			const related = /* @__PURE__ */ new Set();
			const upstreamSeen = /* @__PURE__ */ new Set();
			const downstreamSeen = /* @__PURE__ */ new Set();
			const visitUpstream = (id) => {
				if (upstreamSeen.has(id)) return;
				upstreamSeen.add(id);
				related.add(id);
				for (const dependency of byId.get(id)?.dependencies ?? []) visitUpstream(dependency);
			};
			const visitDownstream = (id) => {
				if (downstreamSeen.has(id)) return;
				downstreamSeen.add(id);
				related.add(id);
				for (const dependent of dependents.get(id) ?? []) visitDownstream(dependent);
			};
			visitUpstream(taskId);
			visitDownstream(taskId);
			return related;
		}
		//#endregion
		//#region lib/client/activity-monitor.js
		/** Shared, demand-driven state for the AgentTeams browser monitor. */
		const targets = /* @__PURE__ */ new Map();
		const targetListeners = /* @__PURE__ */ new Set();
		const snapshotListeners = /* @__PURE__ */ new Set();
		let targetSnapshot = [];
		let activitySnapshots = {
			teams: [],
			archivedTeams: []
		};
		function targetKey(sessionId, teamId) {
			return `${sessionId}\u0000${teamId}`;
		}
		function publishTargets() {
			targetSnapshot = [...targets.values()].filter((target) => target.active).map(({ key, sessionId, teamId }) => ({
				key,
				sessionId,
				teamId
			}));
			for (const listener of targetListeners) listener();
		}
		/** Subscribe to the active monitor-target list (React external-store shape). */
		function subscribeActivityMonitorTargets(listener) {
			targetListeners.add(listener);
			return () => {
				targetListeners.delete(listener);
			};
		}
		/** Read the stable active-target snapshot. */
		function getActivityMonitorTargetsSnapshot() {
			return targetSnapshot;
		}
		/**
		* Register one successful AgentTeams card as a monitoring demand.
		*
		* The returned cleanup is reference-counted so multiple cards and React
		* StrictMode remounts cannot stop another card's monitor.
		*/
		function monitorAgentTeam(sessionId, teamId) {
			const owner = sessionId.trim();
			const id = teamId.trim();
			if (owner === "" || id === "") return () => {};
			const key = targetKey(owner, id);
			const existing = targets.get(key);
			if (existing === void 0) {
				targets.set(key, {
					key,
					sessionId: owner,
					teamId: id,
					refs: 1,
					active: true
				});
				publishTargets();
			} else {
				existing.refs += 1;
				if (!existing.active) {
					existing.active = true;
					publishTargets();
				}
			}
			let released = false;
			return () => {
				if (released) return;
				released = true;
				const current = targets.get(key);
				if (current === void 0) return;
				current.refs -= 1;
				if (current.refs <= 0) {
					targets.delete(key);
					if (current.active) publishTargets();
				}
			};
		}
		/** Stop polling targets whose final archived snapshot has been captured. */
		function settleActivityMonitorTargets(keys) {
			let changed = false;
			for (const key of keys) {
				const target = targets.get(key);
				if (target?.active !== true) continue;
				target.active = false;
				changed = true;
			}
			if (changed) publishTargets();
		}
		/** Subscribe to the shared live/archive snapshot. */
		function subscribeActivitySnapshots(listener) {
			snapshotListeners.add(listener);
			return () => {
				snapshotListeners.delete(listener);
			};
		}
		/** Read the stable shared live/archive snapshot. */
		function getActivitySnapshotsSnapshot() {
			return activitySnapshots;
		}
		/** Publish one or both successful state-route responses. */
		function updateActivitySnapshots(update) {
			const next = {
				teams: update.teams ?? activitySnapshots.teams,
				archivedTeams: update.archivedTeams ?? activitySnapshots.archivedTeams
			};
			if (next.teams === activitySnapshots.teams && next.archivedTeams === activitySnapshots.archivedTeams) return;
			activitySnapshots = next;
			for (const listener of snapshotListeners) listener();
		}
		/** Poll cadence for the live host snapshot route. */
		const ACTIVITY_POLL_MS = 1e3;
		/**
		* Low-frequency probe cadence while a cardless discovery session still owns
		* no team. The probe keeps the panel able to pick up a team created later in
		* that session (e.g. a run_code-wrapped agent_teams_create) without turning
		* every ordinary session into a one-second filesystem scan.
		*/
		const ACTIVITY_PROBE_MS = 5e3;
		/** Host route serving live and archived team snapshots. */
		const ACTIVITY_STATE_URL = "/plugins/dsh-agent-teams/state";
		const ACTIVITY_HALT_URL = "/plugins/dsh-agent-teams/halt";
		/**
		* Start the single polling loop for the current session's requested targets.
		*
		* With neither targets nor a discovery session this is deliberately inert.
		* Explicit card targets poll at the live cadence from the start. A discovery
		* session performs an immediate live+archive restore pass, then — while it
		* still owns no team — probes on a low-frequency cadence, so a team created
		* later in that session (e.g. a run_code-wrapped agent_teams_create) is
		* discovered without a manual reload, without turning every ordinary session
		* into a one-second filesystem scan. The moment a team for the discovery
		* session appears, the controller upgrades to the live one-second cadence for
		* the rest of its lifetime. The caller — the session view, which stops the
		* controller when the session is no longer current — bounds the lifetime, and
		* archive state is refreshed when a target or a previously discovered live
		* team disappears.
		*/
		function startActivityPolling(monitorTargets, runtime = {}) {
			const discoverySessionId = runtime.discoverySessionId?.trim();
			if (monitorTargets.length === 0 && (discoverySessionId === void 0 || discoverySessionId === "")) return {
				firstTick: Promise.resolve(),
				stop: () => {}
			};
			const fetchState = runtime.fetchState ?? ((url, init) => fetch(url, init));
			const schedule = runtime.schedule ?? ((callback, intervalMs) => setInterval(callback, intervalMs));
			const cancel = runtime.cancel ?? ((timer) => {
				clearInterval(timer);
			});
			const publishSnapshots = runtime.publishSnapshots ?? updateActivitySnapshots;
			const settleTargets = runtime.settleTargets ?? settleActivityMonitorTargets;
			let cancelled = false;
			let inFlight = false;
			let hot = monitorTargets.length > 0;
			let discoveryComplete = false;
			let discoveredLiveKeys = /* @__PURE__ */ new Set();
			let controller;
			let timer;
			const intervalMs = () => hot ? ACTIVITY_POLL_MS : ACTIVITY_PROBE_MS;
			const reschedule = () => {
				cancel(timer);
				timer = schedule(() => {
					tick();
				}, intervalMs());
			};
			const tick = async () => {
				if (inFlight || cancelled) return;
				inFlight = true;
				controller = new AbortController();
				try {
					const liveResponse = await fetchState(ACTIVITY_STATE_URL, {
						cache: "no-store",
						signal: controller.signal
					});
					if (!liveResponse.ok) throw new Error("Activity unavailable");
					const body = await liveResponse.json();
					if (cancelled) return;
					if (!Array.isArray(body.teams)) throw new Error("Invalid activity response");
					runtime.onStatus?.("ready");
					const liveTeams = body.teams;
					publishSnapshots({ teams: liveTeams });
					const previousDiscoveredKeys = discoveredLiveKeys;
					discoveredLiveKeys = new Set(discoverySessionId === void 0 || discoverySessionId === "" ? [] : liveTeams.filter((team) => team.captainSessionId === discoverySessionId).map((team) => team.teamId));
					if (!hot && discoveredLiveKeys.size > 0) {
						hot = true;
						reschedule();
					}
					const discoveredTeamArchived = [...previousDiscoveredKeys].some((teamId) => !discoveredLiveKeys.has(teamId));
					const missing = monitorTargets.filter((target) => !liveTeams.some((team) => team.captainSessionId === target.sessionId && team.teamId === target.teamId));
					const needsDiscoveryArchive = discoverySessionId !== void 0 && discoverySessionId !== "" && !discoveryComplete;
					if (missing.length === 0 && !needsDiscoveryArchive && !discoveredTeamArchived) return;
					const archivedResponse = await fetchState(`${ACTIVITY_STATE_URL}?archived=1`, {
						cache: "no-store",
						signal: controller.signal
					});
					if (!archivedResponse.ok) throw new Error("Archive unavailable");
					const archivedBody = await archivedResponse.json();
					if (cancelled) return;
					if (!Array.isArray(archivedBody.teams)) throw new Error("Invalid archive response");
					publishSnapshots({ archivedTeams: archivedBody.teams });
					discoveryComplete = true;
					settleTargets(new Set(missing.map((target) => target.key)));
				} catch (error) {
					if (error?.name === "AbortError") return;
					if (!cancelled) runtime.onStatus?.("error");
				} finally {
					inFlight = false;
				}
			};
			const firstTick = tick();
			if (timer === void 0) timer = schedule(() => {
				tick();
			}, intervalMs());
			return {
				firstTick,
				stop: () => {
					if (cancelled) return;
					cancelled = true;
					controller?.abort();
					cancel(timer);
				}
			};
		}
		//#endregion
		//#region \0dsh-css:G:\dsh_agents\src\client\AgentTeamsCard.module.css.mjs
		const css$1 = ".tgm3Xa_root{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);border-radius:10px;flex-direction:column;gap:8px;width:100%;min-width:0;padding:10px 12px;display:flex}.tgm3Xa_head{align-items:center;gap:8px;min-width:0;display:flex}.tgm3Xa_leadAvatar{object-fit:contain;filter:none;background:0 0;border:0;border-radius:0;flex:none;width:30px;height:30px}.tgm3Xa_teamName{color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;flex:0 auto;font-size:13px;font-weight:600;line-height:20px;overflow:hidden}.tgm3Xa_memberCount{color:var(--dsw-alias-label-tertiary);white-space:nowrap;flex:none;margin-left:auto;font-size:11px;line-height:16px}.tgm3Xa_panelButton{border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;flex:none;padding:2px 8px;font-size:10.5px;font-weight:600;line-height:16px;transition:border-color .12s,color .12s}.tgm3Xa_panelButton:hover{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary)}.tgm3Xa_panelButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}.tgm3Xa_members{flex-wrap:wrap;gap:6px;min-width:0;display:flex}.tgm3Xa_member{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);max-width:160px;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;align-items:center;gap:5px;padding:3px 8px 3px 3px;font-size:11px;font-weight:500;line-height:16px;transition:border-color .12s,background-color .12s;display:inline-flex}.tgm3Xa_member:hover{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-button-ghost-active-fill)}.tgm3Xa_member:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}.tgm3Xa_memberArt{object-fit:contain;filter:none;background:0 0;border:0;border-radius:0;width:24px;height:24px}.tgm3Xa_memberInitial{background:var(--dsw-alias-state-business-primary);width:20px;height:20px;color:var(--dsw-alias-label-primary-inverted);border-radius:50%;justify-content:center;align-items:center;font-size:10px;font-weight:600;line-height:20px;display:inline-flex}.tgm3Xa_memberName{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.tgm3Xa_chatEntry{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font:inherit;white-space:nowrap;cursor:pointer;background:0 0;border-radius:7px;align-items:center;gap:5px;padding:3px 8px;font-size:12px;display:inline-flex}.tgm3Xa_chatEntry img{object-fit:contain;width:22px;height:22px}.tgm3Xa_chatEntry:hover{background:var(--dsw-alias-bg-module-platform)}.tgm3Xa_chatEntry:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.tgm3Xa_turnCards{gap:8px;margin-block:10px;display:grid}@media (width<=600px){.tgm3Xa_head{flex-wrap:wrap}}";
		const tagId$1 = "@yogurtss/dsh-teamflow/AgentTeamsCard.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@yogurtss/dsh-teamflow";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var AgentTeamsCard_module_css_default = {
			"chatEntry": "tgm3Xa_chatEntry",
			"head": "tgm3Xa_head",
			"leadAvatar": "tgm3Xa_leadAvatar",
			"member": "tgm3Xa_member",
			"memberArt": "tgm3Xa_memberArt",
			"memberCount": "tgm3Xa_memberCount",
			"memberInitial": "tgm3Xa_memberInitial",
			"memberName": "tgm3Xa_memberName",
			"members": "tgm3Xa_members",
			"panelButton": "tgm3Xa_panelButton",
			"root": "tgm3Xa_root",
			"teamName": "tgm3Xa_teamName",
			"turnCards": "tgm3Xa_turnCards"
		};
		//#endregion
		//#region lib/client/AgentTeamsCard.js
		/**
		* AgentTeams conversation card: the lightweight in-conversation summary for
		* one team — the captain's role avatar and name, the member roster as
		* clickable role avatars (opening the member's subagent transcript), and
		* an "activity panel" button that re-activates the top-right floater.
		*
		* The floater and this card share the `agent-teams:open-panel` window event
		* so the card can summon the panel even after it was closed (or when an old
		* session is re-opened for review).
		* @module dsh-agent-teams/client/card
		*/
		/** Window event name the floater listens for to open itself. */
		const OPEN_PANEL_EVENT = "agent-teams:open-panel";
		/** Open the matching team view, carrying this team's summary
		* so the panel can show it even when the team no longer exists on disk
		* (historical session review). */
		function openActivityPanel(data) {
			window.dispatchEvent(new CustomEvent(OPEN_PANEL_EVENT, { detail: {
				teamId: data.teamId,
				captainSessionId: data.captainSessionId,
				teamName: data.teamName,
				members: data.members
			} }));
		}
		/** Render one durable team as a compact conversation card. */
		const noWorkspace = () => void 0;
		const noSubscription = () => () => {};
		function AgentTeamsCard({ node, openMember, sessionId, t, workspaceBridge }) {
			const native = (0, react.useSyncExternalStore)(workspaceBridge?.subscribe ?? noSubscription, workspaceBridge?.getSnapshot ?? noWorkspace);
			const location = node.location;
			if (native && (location.kind === "turn" || location.kind === "step") && location.turn.status === "closed") return null;
			return (0, react_jsx_runtime.jsx)(AgentTeamsSummary, {
				data: node.data,
				openMember,
				sessionId,
				t
			});
		}
		function AgentTeamsSummary({ data, openMember, sessionId, t }) {
			const owner = data.captainSessionId || sessionId;
			const { teams, archivedTeams } = (0, react.useSyncExternalStore)(subscribeActivitySnapshots, getActivitySnapshotsSnapshot);
			(0, react.useEffect)(() => {
				return monitorAgentTeam(owner, data.teamId);
			}, [data.teamId, owner]);
			const snapshot = teams.find((team) => team.teamId === data.teamId && (owner === "" || team.captainSessionId === owner)) ?? archivedTeams.find((team) => team.teamId === data.teamId && (owner === "" || team.captainSessionId === owner));
			const resolved = (0, react.useMemo)(() => ({
				...data,
				captainSessionId: snapshot?.captainSessionId ?? owner,
				teamName: snapshot?.name ?? data.teamName,
				members: snapshot?.members.map((member) => ({
					id: member.id,
					name: member.name,
					role: member.role
				})) ?? data.members
			}), [
				data,
				owner,
				snapshot
			]);
			return (0, react_jsx_runtime.jsxs)("section", {
				className: AgentTeamsCard_module_css_default.root,
				"data-agent-teams-card": true,
				"data-team-id": resolved.teamId,
				children: [(0, react_jsx_runtime.jsxs)("header", {
					className: AgentTeamsCard_module_css_default.head,
					children: [
						(0, react_jsx_runtime.jsx)("img", {
							className: AgentTeamsCard_module_css_default.leadAvatar,
							src: LEAD_ART,
							alt: "",
							"aria-hidden": true
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: AgentTeamsCard_module_css_default.teamName,
							title: resolved.teamName,
							children: resolved.teamName
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: AgentTeamsCard_module_css_default.memberCount,
							children: t("card.memberCount", { count: resolved.members.length })
						}),
						(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: AgentTeamsCard_module_css_default.panelButton,
							onClick: () => {
								openActivityPanel(resolved);
							},
							"aria-label": t("workspace.focus"),
							title: t("workspace.focus"),
							children: t("workspace.focus")
						})
					]
				}), resolved.members.length > 0 && (0, react_jsx_runtime.jsx)("div", {
					className: AgentTeamsCard_module_css_default.members,
					children: resolved.members.map((member) => (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: AgentTeamsCard_module_css_default.member,
						onClick: () => {
							if (member.id !== "") openMember(owner, member.id);
						},
						title: member.role === "" ? member.name : `${member.name} · ${member.role}`,
						children: [memberArtUrl(member.name, member.role) !== null ? (0, react_jsx_runtime.jsx)("img", {
							className: AgentTeamsCard_module_css_default.memberArt,
							src: memberArtUrl(member.name, member.role) ?? "",
							alt: "",
							"aria-hidden": true
						}) : (0, react_jsx_runtime.jsx)("span", {
							className: AgentTeamsCard_module_css_default.memberInitial,
							children: member.name.trim().slice(0, 1).toUpperCase() || "?"
						}), (0, react_jsx_runtime.jsx)("span", {
							className: AgentTeamsCard_module_css_default.memberName,
							children: member.name
						})]
					}, member.id || member.name))
				})]
			});
		}
		//#endregion
		//#region lib/client/panel-geometry.js
		/** Pure persisted geometry rules for the AgentTeams shell-overlay panel. */
		const PANEL_LAYOUT_STORAGE_KEY = "dsh-agent-teams:activity-panel:v1";
		const DEFAULT_PANEL_LAYOUT = Object.freeze({
			mode: "docked",
			x: 0,
			y: 64,
			width: 388,
			height: 640,
			heightMode: "auto"
		});
		function clamp(value, minimum, maximum) {
			return Math.min(Math.max(value, minimum), maximum);
		}
		function finite(value) {
			return typeof value === "number" && Number.isFinite(value);
		}
		/** Decode one versioned localStorage value, rejecting partial/corrupt state. */
		function parsePanelLayout(value) {
			if (value === null) return DEFAULT_PANEL_LAYOUT;
			try {
				const parsed = JSON.parse(value);
				if (typeof parsed !== "object" || parsed === null) return DEFAULT_PANEL_LAYOUT;
				const record = parsed;
				if (record.mode !== "docked" && record.mode !== "floating" || !finite(record.x) || !finite(record.y) || !finite(record.width) || !finite(record.height)) return DEFAULT_PANEL_LAYOUT;
				return {
					mode: record.mode,
					x: record.x,
					y: record.y,
					width: record.width,
					height: record.height,
					heightMode: record.mode === "floating" && record.heightMode === "manual" ? "manual" : "auto"
				};
			} catch {
				return DEFAULT_PANEL_LAYOUT;
			}
		}
		/** Whether the panel should become a simple inset overlay with no gestures. */
		function compactPanelForBounds(bounds) {
			return bounds.width <= 960;
		}
		/** Docked and compact panels always fit content; floating panels may be user-sized. */
		function panelUsesAutoHeight(layout, bounds) {
			return compactPanelForBounds(bounds) || layout.mode === "docked" || layout.heightMode === "auto";
		}
		/** CSS max-height ceiling that keeps an auto-height panel inside its shell. */
		function panelMaximumHeight(layout, bounds) {
			const bottomInset = compactPanelForBounds(bounds) || layout.mode === "floating" ? 12 : 48;
			return Math.max(1, bounds.height - layout.y - bottomInset);
		}
		/** Resolve persisted state into a visible rectangle inside the current shell. */
		function resolvePanelGeometry(layout, bounds) {
			const boundsWidth = Math.max(1, bounds.width);
			const boundsHeight = Math.max(1, bounds.height);
			if (compactPanelForBounds(bounds)) return {
				...layout,
				x: 12,
				y: 12,
				width: Math.max(1, boundsWidth - 24),
				height: Math.max(1, boundsHeight - 24)
			};
			const maximumWidth = Math.max(1, Math.min(640, boundsWidth - 24));
			const minimumWidth = Math.min(320, maximumWidth);
			const width = clamp(layout.width, minimumWidth, maximumWidth);
			const maximumHeight = Math.max(1, boundsHeight - 24);
			const minimumHeight = Math.min(360, maximumHeight);
			if (layout.mode === "docked") {
				const y = clamp(64, 12, Math.max(12, boundsHeight - minimumHeight - 12));
				const availableHeight = Math.max(1, boundsHeight - y - 48);
				const height = clamp(availableHeight, Math.min(minimumHeight, availableHeight), maximumHeight);
				const anchorRight = clamp(bounds.anchorRight, 0, boundsWidth);
				const maximumX = Math.max(12, boundsWidth - width - 12);
				return {
					mode: "docked",
					x: clamp(anchorRight - 18 - width, 12, maximumX),
					y,
					width,
					height,
					heightMode: layout.heightMode
				};
			}
			const height = clamp(layout.height, minimumHeight, maximumHeight);
			return {
				mode: "floating",
				x: clamp(layout.x, 12, Math.max(12, boundsWidth - width - 12)),
				y: clamp(layout.y, 12, Math.max(12, boundsHeight - height - 12)),
				width,
				height,
				heightMode: layout.heightMode
			};
		}
		/** Undock without a visual jump by adopting the panel's resolved rectangle. */
		function floatPanelLayout(geometry, bounds) {
			return resolvePanelGeometry({
				...geometry,
				mode: "floating"
			}, bounds);
		}
		/** Return to the right dock, preserving width and restoring content-fit height. */
		function dockPanelLayout(layout, bounds) {
			return resolvePanelGeometry({
				...layout,
				mode: "docked",
				heightMode: "auto"
			}, bounds);
		}
		/** Translate a floating panel and clamp it back into the visible shell. */
		function movePanelLayout(start, dx, dy, bounds) {
			return resolvePanelGeometry({
				...start,
				mode: "floating",
				x: start.x + dx,
				y: start.y + dy
			}, bounds);
		}
		/** Resize while keeping the edge opposite the active handle stationary. */
		function resizePanelLayout(start, edge, dx, dy, bounds) {
			if (start.mode === "docked") {
				if (edge !== "left") return resolvePanelGeometry(start, bounds);
				return resolvePanelGeometry({
					...start,
					width: start.width - dx
				}, bounds);
			}
			const resolved = resolvePanelGeometry(start, bounds);
			const minimumWidth = Math.min(320, resolved.x + resolved.width - 12);
			const minimumHeight = Math.min(360, bounds.height - resolved.y - 12);
			if (edge === "left") {
				const right = resolved.x + resolved.width;
				const maximumWidth = Math.max(1, Math.min(640, right - 12));
				const width = clamp(resolved.width - dx, Math.min(minimumWidth, maximumWidth), maximumWidth);
				return {
					...resolved,
					x: right - width,
					width
				};
			}
			const maximumHeight = Math.max(1, bounds.height - resolved.y - 12);
			const height = clamp(resolved.height + dy, Math.min(minimumHeight, maximumHeight), maximumHeight);
			if (edge === "bottom") return {
				...resolved,
				height,
				heightMode: "manual"
			};
			const maximumWidth = Math.max(1, Math.min(640, bounds.width - resolved.x - 12));
			const width = clamp(resolved.width + dx, Math.min(minimumWidth, maximumWidth), maximumWidth);
			return {
				...resolved,
				width,
				height,
				heightMode: "manual"
			};
		}
		//#endregion
		//#region lib/client/ActivityPanel.js
		/**
		* AgentTeams activity panel: the top-right floater monitoring every team.
		*
		* Modeled on the Claude Code desktop SessionActivityPanel: a shell-overlay
		* panel that docks at the conversation's top-right edge by default, can be
		* dragged into a floating window, resized, and folded into an activity badge.
		* On wide viewports the docked panel makes the conversation column yield
		* space; narrow viewports keep a simple inset overlay. It
		* polls the host `/plugins/dsh-agent-teams/state` route for
		* server-side snapshots (durable files + live subagent activity), with a
		* collapsed badge that auto-expands once when activity appears. Archived
		* teams stay available for the owning conversation after live work ends.
		*
		* The floater mounts in ui-layout's additive `shell.overlay`; it is not a
		* conversation node — the in-conversation panel was removed in favor of this
		* always-available monitor.
		* @module dsh-agent-teams/client/activity
		*/
		/** Grace before the panel collapses once no team remains. */
		const AUTOCLOSE_GRACE_MS = 2e3;
		/**
		* Page-settle window after mount: activity restored on page load only shows
		* the collapsed badge, so the panel never yanks the conversation column
		* right after load. New activity after this window auto-expands as usual.
		*/
		const AUTO_OPEN_SETTLE_MS = 4e3;
		/** Root marker shared with the panel CSS while the shell overlay is expanded. */
		const PANEL_OPEN_ATTRIBUTE = "data-agent-teams-panel-open";
		/** Shared width concession consumed by the conversation root CSS. */
		const PANEL_SHIFT_PROPERTY = "--agent-teams-panel-shift";
		const PANEL_CONVERSATION_GAP = 14;
		const MOVE_THRESHOLD = 4;
		const CAPTAIN_ASSIGNEE = "captain";
		function initialPanelLayout() {
			if (typeof window === "undefined") return DEFAULT_PANEL_LAYOUT;
			return parsePanelLayout(window.localStorage.getItem(PANEL_LAYOUT_STORAGE_KEY));
		}
		function initialPanelBounds() {
			if (typeof window === "undefined") return {
				width: 1440,
				height: 900,
				anchorRight: 1440
			};
			return {
				width: window.innerWidth,
				height: window.innerHeight,
				anchorRight: window.innerWidth
			};
		}
		/** Initial-letter fallback for unmatched roles. */
		function memberInitial(name) {
			return name.trim().slice(0, 1).toUpperCase() || "?";
		}
		function stableHash(value) {
			let hash = 0;
			for (let index = 0; index < value.length; index += 1) hash = (hash << 5) - hash + value.charCodeAt(index) | 0;
			return Math.abs(hash);
		}
		const ACCENTS = [
			"var(--dsw-alias-state-business-primary)",
			"var(--dsw-alias-state-success-primary)",
			"var(--dsw-alias-state-error-primary)",
			"var(--dsw-alias-state-warn-primary)",
			"var(--dsw-alias-label-tertiary)"
		];
		function accentOf(id) {
			return ACCENTS[stableHash(id) % ACCENTS.length] ?? ACCENTS[0];
		}
		/** Badge text follows the raw task status:
		* claimed/pending/failed/cancelled keep their own labels and colors. */
		const TASK_STATUS_LABEL = {
			pending: "task.status.pending",
			claimed: "task.status.claimed",
			in_progress: "task.status.inProgress",
			completed: "task.status.completed",
			failed: "task.status.failed",
			cancelled: "task.status.cancelled"
		};
		function taskStatusLabel(status, t) {
			const key = TASK_STATUS_LABEL[status];
			return key === void 0 ? status : t(key);
		}
		function formatTaskIds(ids, t) {
			return ids.join(t("format.listSeparator"));
		}
		function taskTitle(task, model) {
			const extras = [
				task.kind,
				task.round === void 0 ? void 0 : `r${task.round}`,
				task.verdict,
				task.verdictStale === void 0 ? void 0 : `⚠ ${task.verdictStale}`,
				model === "" ? void 0 : model
			].filter((item) => item !== void 0);
			return extras.length === 0 ? `${task.id} · ${task.subject}` : `${task.id} · ${task.subject} · ${extras.join(" · ")}`;
		}
		/** Badge/bar coloring key: visual state, widened for terminal statuses. */
		function taskTone(state, status) {
			if (status === "failed") return "failed";
			if (status === "cancelled") return "cancelled";
			return state;
		}
		function Chevron({ open }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				className: ActivityPanel_module_css_default.chevron,
				"data-open": open,
				width: "9",
				height: "9",
				viewBox: "0 0 10 10",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				strokeLinecap: "round",
				"aria-hidden": true,
				children: (0, react_jsx_runtime.jsx)("path", { d: "M3.5 2l3 3-3 3" })
			});
		}
		function WorkGlyph({ active }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				className: ActivityPanel_module_css_default.workGlyph,
				"data-active": active,
				width: "11",
				height: "11",
				viewBox: "0 0 11 11",
				fill: "currentColor",
				"aria-hidden": true,
				children: [
					[0, 0],
					[4.2, 0],
					[8.4, 0],
					[0, 4.2],
					[4.2, 4.2],
					[8.4, 4.2]
				].map(([x, y], index) => (0, react_jsx_runtime.jsx)("rect", {
					x,
					y,
					width: "2.6",
					height: "2.6",
					rx: ".6",
					style: { animationDelay: `${index * .15}s` }
				}, `${x}:${y}`))
			});
		}
		/** Collapsed badge: an always-visible corner pill while any team exists. */
		function CollapsedBadge({ count, busy, onClick, t }) {
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: ActivityPanel_module_css_default.badge,
				"data-agent-teams-collapsed": true,
				"data-busy": busy,
				onClick,
				"aria-label": t("activity.badgeAria", { count }),
				children: [(0, react_jsx_runtime.jsx)("span", {
					className: ActivityPanel_module_css_default.badgeDot,
					"data-busy": busy,
					"aria-hidden": true
				}), (0, react_jsx_runtime.jsx)("span", {
					className: ActivityPanel_module_css_default.badgeCount,
					children: count
				})]
			});
		}
		function memberStateLabel(member, tasks, historic, t) {
			const owned = tasks.filter((task) => task.assignee === member.name);
			if (member.activity === "working") return t("member.state.working");
			if (owned.some((task) => task.status === "failed")) return t("member.state.failed");
			if (owned.some((task) => task.state === "blocked")) return t("member.state.waiting");
			if (owned.length > 0 && owned.every((task) => task.status === "completed")) return t("member.state.delivered");
			if (member.status === "removed") return t(historic ? "member.state.left" : "member.state.removed");
			if (owned.length > 0) return t("member.state.pending");
			return t("member.state.unassigned");
		}
		function memberStatusText(member, tasks, t) {
			const owned = tasks.filter((task) => task.assignee === member.name);
			const current = owned.find((task) => task.id === member.currentTask);
			const blocked = owned.find((task) => task.state === "blocked");
			if (member.activity === "working" && current !== void 0) {
				const model = taskModelLabel(current, [member]);
				return model === "" ? t("member.status.executing", { taskId: current.id }) : t("member.status.executingModel", {
					taskId: current.id,
					model
				});
			}
			if (member.activity === "working") return t("member.status.working");
			if (blocked !== void 0) {
				const dependency = tasks.find((task) => blocked.dependencies.includes(task.id) && task.state !== "completed");
				if (dependency !== void 0) return t("member.status.waitingOn", {
					taskId: dependency.id,
					assignee: dependency.assignee || t("task.assignee.unclaimed")
				});
				return t("member.status.waitingPrerequisite");
			}
			if (member.total === 0) return t("member.status.waitingAssignment");
			if (member.done === member.total) return t("member.status.delivered");
			if (owned.some((task) => task.status === "failed")) return t("task.detail.failed");
			if (owned.length > 0 && owned.every((task) => task.status === "completed" || task.status === "cancelled")) return t("member.status.settled");
			return t(member.activity === "idle" ? "member.status.idle" : "member.status.unknown");
		}
		function compactTaskLabel(subject) {
			const withoutVerb = subject.replace(/^开发\s*/u, "").replace(/^\d+[-_.、\s]*/u, "");
			const head = withoutVerb.split(/[（(·：:]/u)[0]?.trim() ?? withoutVerb;
			return head.length > 18 ? `${head.slice(0, 17)}…` : head;
		}
		function taskSummary(team, t, discarded = false) {
			const completed = team.tasks.filter((task) => task.status === "completed");
			const cancelled = team.tasks.filter((task) => task.status === "cancelled");
			const running = team.tasks.filter((task) => task.state === "running");
			const claimed = team.tasks.filter((task) => task.state === "claimed");
			const blocked = team.tasks.filter((task) => task.state === "blocked");
			const ready = team.tasks.filter((task) => task.state === "open" && task.status !== "completed" && task.status !== "failed" && task.status !== "cancelled");
			const failed = team.tasks.filter((task) => task.status === "failed");
			if (discarded) return t("task.summary.discarded", { count: team.tasks.length });
			if (team.tasks.length === 0) return t("task.summary.waitingBreakdown");
			if (team.phase === "staged") return t("task.summary.staged", { count: team.tasks.length });
			if (completed.length === team.tasks.length) return t("task.summary.allDelivered", { count: completed.length });
			if (completed.length + cancelled.length + failed.length === team.tasks.length) return t("task.summary.ended", {
				completed: completed.length,
				cancelled: cancelled.length,
				failed: failed.length
			});
			if (failed.length > 0 && running.length === 0 && claimed.length === 0 && ready.length === 0 && blocked.length === 0) return t("task.summary.failedSettled", { count: failed.length });
			if (blocked.length > 0 && running.length > 0) return t("task.summary.blockedAndRunning", {
				tasks: formatTaskIds(blocked.slice(0, 3).map((task) => task.id), t),
				more: blocked.length > 3 ? t("task.summary.more", { count: blocked.length - 3 }) : ""
			});
			if (running.length > 0) return t("task.summary.running", { tasks: formatTaskIds(running.map((task) => task.id), t) });
			if (claimed.length > 0) return t("task.summary.claimed", { tasks: formatTaskIds(claimed.map((task) => task.id), t) });
			if (ready.length > 0) return t("task.summary.ready", { tasks: formatTaskIds(ready.map((task) => task.id), t) });
			if (blocked.length > 0) return t("task.summary.blocked", { tasks: formatTaskIds(blocked.map((task) => task.id), t) });
			return t("task.summary.waitingSchedule");
		}
		function ProgressOverview({ team, t, discarded = false }) {
			const running = discarded ? 0 : team.tasks.filter((task) => task.state === "running").length;
			const claimed = discarded ? 0 : team.tasks.filter((task) => task.state === "claimed").length;
			const blocked = discarded ? 0 : team.tasks.filter((task) => task.state === "blocked").length;
			const completed = discarded ? 0 : team.tasks.filter((task) => task.status === "completed").length;
			const settled = !discarded && team.tasks.length > 0 && team.tasks.every((task) => task.status === "completed" || task.status === "failed" || task.status === "cancelled");
			const summaryTone = discarded ? "discarded" : blocked > 0 || team.tasks.some((task) => task.status === "failed" || task.status === "cancelled") ? "warning" : settled ? "completed" : "running";
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ActivityPanel_module_css_default.progressOverview,
				"aria-label": t("progress.aria"),
				"data-progress-summary": true,
				children: [
					(0, react_jsx_runtime.jsx)("span", {
						className: ActivityPanel_module_css_default.progressTitle,
						children: t("progress.title")
					}),
					team.tasks.length > 0 ? (0, react_jsx_runtime.jsx)("span", {
						className: ActivityPanel_module_css_default.progressSegments,
						"aria-hidden": true,
						children: team.tasks.map((task) => (0, react_jsx_runtime.jsx)("span", { "data-state": discarded ? "cancelled" : taskTone(task.state, task.status) }, task.id))
					}) : (0, react_jsx_runtime.jsx)("span", { className: ActivityPanel_module_css_default.progressEmpty }),
					(0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.progressLegend,
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								"data-state": "running",
								children: t("progress.running", { count: running })
							}),
							claimed > 0 && (0, react_jsx_runtime.jsx)("span", {
								"data-state": "claimed",
								children: t("progress.claimed", { count: claimed })
							}),
							(0, react_jsx_runtime.jsx)("span", {
								"data-state": "blocked",
								children: t("progress.blocked", { count: blocked })
							}),
							(0, react_jsx_runtime.jsx)("span", {
								"data-state": "completed",
								children: t("progress.delivered", { count: completed })
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.progressSummary,
						"data-state": summaryTone,
						children: [(0, react_jsx_runtime.jsx)("span", { className: ActivityPanel_module_css_default.progressSummaryDot }), (0, react_jsx_runtime.jsx)("span", { children: taskSummary(team, t, discarded) })]
					})
				]
			});
		}
		/** Workspace-only summary of durable completion and the current unread inbox.
		* The snapshot is not a chat transcript: it provides at most five unread
		* captain messages, with no timestamps, so do not imply a complete history.
		*/
		function WorkspaceSummary({ team, t, discarded }) {
			const completed = discarded ? 0 : team.tasks.filter((task) => task.status === "completed").length;
			const total = team.tasks.length;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: ActivityPanel_module_css_default.workspaceSummary,
				children: [(0, react_jsx_runtime.jsxs)("section", {
					className: ActivityPanel_module_css_default.completionCard,
					"aria-label": t("progress.aria"),
					children: [(0, react_jsx_runtime.jsx)("h3", { children: t("progress.title") }), (0, react_jsx_runtime.jsxs)("div", {
						className: ActivityPanel_module_css_default.completionBody,
						children: [(0, react_jsx_runtime.jsxs)("div", {
							className: ActivityPanel_module_css_default.completionRing,
							role: "img",
							"aria-label": t("team.stats.completed", {
								completed,
								total
							}),
							"data-completed": completed,
							"data-total": total,
							children: [(0, react_jsx_runtime.jsxs)("svg", {
								viewBox: "0 0 120 120",
								"aria-hidden": true,
								children: [(0, react_jsx_runtime.jsx)("circle", {
									className: ActivityPanel_module_css_default.ringTrack,
									cx: "60",
									cy: "60",
									r: "51"
								}), (0, react_jsx_runtime.jsx)("circle", {
									className: ActivityPanel_module_css_default.ringValue,
									cx: "60",
									cy: "60",
									r: "51",
									pathLength: "100",
									strokeDasharray: `${total === 0 ? 0 : completed / total * 100} 100`
								})]
							}), (0, react_jsx_runtime.jsxs)("span", {
								"aria-hidden": true,
								children: [(0, react_jsx_runtime.jsxs)("strong", { children: [completed, (0, react_jsx_runtime.jsxs)("small", { children: [" / ", total] })] }), (0, react_jsx_runtime.jsx)("span", { children: t(discarded ? "task.status.notRun" : "workspace.completed") })]
							})]
						}), total === 0 ? (0, react_jsx_runtime.jsx)("p", {
							className: ActivityPanel_module_css_default.summaryEmpty,
							children: t("workspace.noTasks")
						}) : (0, react_jsx_runtime.jsx)("ul", {
							className: ActivityPanel_module_css_default.completionTasks,
							tabIndex: 0,
							"aria-label": t("workspace.taskSummary"),
							children: team.tasks.map((task) => (0, react_jsx_runtime.jsxs)("li", {
								"data-state": discarded ? "cancelled" : taskTone(task.state, task.status),
								"data-verdict-stale": task.verdictStale === void 0 ? void 0 : "true",
								title: taskTitle(task, taskModelLabel(task, team.members)),
								children: [
									(0, react_jsx_runtime.jsx)("span", {
										className: ActivityPanel_module_css_default.completionDot,
										"aria-hidden": true,
										children: task.verdictStale !== void 0 ? "!" : !discarded && task.status === "completed" ? "✓" : "·"
									}),
									(0, react_jsx_runtime.jsx)("span", {
										className: ActivityPanel_module_css_default.completionTaskId,
										children: task.id
									}),
									(0, react_jsx_runtime.jsx)("span", {
										className: ActivityPanel_module_css_default.completionTaskSubject,
										title: task.subject,
										children: task.subject
									}),
									(0, react_jsx_runtime.jsx)("span", {
										className: ActivityPanel_module_css_default.completionTaskStatus,
										children: discarded ? t("task.status.notRun") : task.verdictStale !== void 0 ? t("workspace.verdictStale") : taskStatusLabel(task.status, t)
									})
								]
							}, task.id))
						})]
					})]
				}), (0, react_jsx_runtime.jsxs)("section", {
					className: ActivityPanel_module_css_default.inboxCard,
					"aria-label": t("workspace.inbox"),
					children: [(0, react_jsx_runtime.jsxs)("header", { children: [(0, react_jsx_runtime.jsx)("h3", { children: t("workspace.inbox") }), (0, react_jsx_runtime.jsx)("span", { children: t("workspace.inboxHint") })] }), team.captainInbox.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
						className: ActivityPanel_module_css_default.summaryEmpty,
						children: t("workspace.inboxEmpty")
					}) : (0, react_jsx_runtime.jsx)("ul", {
						className: ActivityPanel_module_css_default.inboxMessages,
						tabIndex: 0,
						"aria-label": t("workspace.inbox"),
						children: team.captainInbox.map((message, index) => {
							const member = team.members.find((candidate) => candidate.name === message.from);
							const art = message.from === CAPTAIN_ASSIGNEE ? LEAD_ART : memberArtUrl(message.from, member?.role ?? "");
							return (0, react_jsx_runtime.jsxs)("li", { children: [art === null ? (0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.inboxInitial,
								"aria-hidden": true,
								children: memberInitial(message.from)
							}) : (0, react_jsx_runtime.jsx)("img", {
								src: art,
								alt: "",
								"aria-hidden": true
							}), (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("strong", { children: message.from }), (0, react_jsx_runtime.jsx)("p", { children: message.content })] })] }, `${index}:${message.from}`);
						})
					})]
				})]
			});
		}
		function DependencyMap({ tasks, members, t, discarded = false, workspace = false, onSelectTask }) {
			const [open, setOpen] = (0, react.useState)(true);
			const [hoverTaskId, setHoverTaskId] = (0, react.useState)(null);
			const [keyboardTaskId, setKeyboardTaskId] = (0, react.useState)(null);
			const [pinnedTaskId, setPinnedTaskId] = (0, react.useState)(null);
			const hoverTimer = (0, react.useRef)(null);
			const focusedTaskId = dependencyFocusTaskId(pinnedTaskId, keyboardTaskId, hoverTaskId);
			const nodeWidth = workspace ? 164 : 92;
			const nodeHeight = workspace ? 76 : 30;
			const layout = (0, react.useMemo)(() => compactDagLayout(tasks, workspace ? {
				nodeWidth: 164,
				nodeHeight: 76,
				columnGap: 36,
				rowGap: 16
			} : void 0), [tasks, workspace]);
			const parallel = (0, react.useMemo)(() => usesParallelTaskGrid(tasks), [tasks]);
			const related = (0, react.useMemo)(() => focusedTaskId === null ? null : relatedTaskIds(focusedTaskId, tasks), [focusedTaskId, tasks]);
			const scheduleHover = (id) => {
				if (hoverTimer.current !== null) {
					clearTimeout(hoverTimer.current);
					hoverTimer.current = null;
				}
				if (id === null) {
					setHoverTaskId(null);
					return;
				}
				hoverTimer.current = setTimeout(() => {
					hoverTimer.current = null;
					setHoverTaskId(id);
				}, 180);
			};
			(0, react.useEffect)(() => () => {
				if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
			}, []);
			(0, react.useEffect)(() => {
				const onKeyDown = (event) => {
					if (event.key === "Escape") {
						setPinnedTaskId(null);
						onSelectTask?.(null);
					}
				};
				window.addEventListener("keydown", onKeyDown);
				return () => {
					window.removeEventListener("keydown", onKeyDown);
				};
			}, [onSelectTask]);
			if (tasks.length === 0) return null;
			const fallbackTask = tasks.find((task) => task.state === "blocked") ?? tasks.find((task) => task.state === "running") ?? tasks.find((task) => task.state === "claimed") ?? tasks[0];
			const detailTask = tasks.find((task) => task.id === focusedTaskId) ?? fallbackTask;
			const detailModel = taskModelLabel(detailTask, members);
			const waitingOn = detailTask.dependencies.filter((dependency) => tasks.find((task) => task.id === dependency)?.status !== "completed");
			const dependents = tasks.filter((task) => task.dependencies.includes(detailTask.id));
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ActivityPanel_module_css_default.dependencySection,
				"aria-label": t("dependency.aria"),
				"data-dependency-map": true,
				children: [(0, react_jsx_runtime.jsxs)("header", {
					className: ActivityPanel_module_css_default.sectionHead,
					children: [(0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: ActivityPanel_module_css_default.sectionToggleTitle,
						onClick: () => {
							setOpen((current) => !current);
						},
						"aria-expanded": open,
						children: [
							(0, react_jsx_runtime.jsx)(Chevron, { open }),
							(0, react_jsx_runtime.jsx)(IconBranchOutline16, {}),
							" ",
							t(parallel ? "dependency.parallel" : "dependency.title")
						]
					}), (0, react_jsx_runtime.jsx)("span", {
						className: ActivityPanel_module_css_default.sectionHint,
						children: pinnedTaskId === null ? t(parallel ? "dependency.hint.parallel" : workspace ? "workspace.dependencies" : "dependency.hint.chain") : t("dependency.hint.pinned", { taskId: pinnedTaskId })
					})]
				}), open && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("div", {
					className: ActivityPanel_module_css_default.dagViewport,
					children: (0, react_jsx_runtime.jsxs)("div", {
						className: ActivityPanel_module_css_default.dagCanvas,
						"data-layout": parallel ? "parallel" : "dependency",
						style: parallel ? void 0 : {
							width: layout.width,
							height: layout.height
						},
						children: [!parallel && (0, react_jsx_runtime.jsx)("svg", {
							className: ActivityPanel_module_css_default.dagEdges,
							width: layout.width,
							height: layout.height,
							"aria-hidden": true,
							children: layout.edges.map((edge) => {
								const active = related !== null && related.has(edge.from) && related.has(edge.to);
								return (0, react_jsx_runtime.jsx)("path", {
									d: edge.path,
									"data-active": active,
									"data-dimmed": related !== null && !active
								}, `${edge.from}:${edge.to}`);
							})
						}), layout.nodes.map(({ task, x, y }) => {
							const model = taskModelLabel(task, members);
							return (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: ActivityPanel_module_css_default.dagNode,
								style: parallel ? { height: nodeHeight } : {
									left: x,
									top: y,
									width: nodeWidth,
									height: nodeHeight
								},
								"data-task-id": task.id,
								"data-state": discarded ? "cancelled" : taskTone(task.state, task.status),
								"data-verdict-stale": task.verdictStale === void 0 ? void 0 : "true",
								"data-task-model": model || void 0,
								"data-focused": related?.has(task.id) ?? false,
								"data-dimmed": related !== null && !related.has(task.id),
								"aria-pressed": pinnedTaskId === task.id,
								title: taskTitle(task, model),
								onClick: () => {
									const next = pinnedTaskId === task.id ? null : task.id;
									setPinnedTaskId(next);
									onSelectTask?.(next);
								},
								onMouseEnter: () => {
									scheduleHover(task.id);
								},
								onMouseLeave: () => {
									scheduleHover(null);
								},
								onFocus: () => {
									setKeyboardTaskId(task.id);
								},
								onBlur: () => {
									setKeyboardTaskId(null);
								},
								children: [
									(0, react_jsx_runtime.jsxs)("span", {
										className: ActivityPanel_module_css_default.dagNodeHead,
										children: [
											(0, react_jsx_runtime.jsx)("span", { className: ActivityPanel_module_css_default.dagNodeDot }),
											task.id,
											workspace && (0, react_jsx_runtime.jsx)("span", {
												className: ActivityPanel_module_css_default.dagOwner,
												children: task.assignee || t("task.assignee.unclaimed")
											})
										]
									}),
									(0, react_jsx_runtime.jsx)("span", {
										className: ActivityPanel_module_css_default.dagNodeLabel,
										children: workspace ? task.subject : compactTaskLabel(task.subject)
									}),
									!discarded && task.state === "claimed" && (0, react_jsx_runtime.jsx)("span", {
										className: ActivityPanel_module_css_default.dagClaimedState,
										children: t("task.status.claimed")
									}),
									task.state === "running" && (0, react_jsx_runtime.jsx)("span", {
										className: ActivityPanel_module_css_default.dagRunningState,
										"aria-label": t("task.runningAria"),
										children: (0, react_jsx_runtime.jsx)(WorkGlyph, { active: true })
									})
								]
							}, task.id);
						})]
					})
				}), (0, react_jsx_runtime.jsxs)("section", {
					className: ActivityPanel_module_css_default.taskDetail,
					"data-task-detail": detailTask.id,
					children: [
						(0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.taskDetailHead,
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									className: ActivityPanel_module_css_default.taskDetailId,
									children: detailTask.id
								}),
								(0, react_jsx_runtime.jsx)("span", {
									className: ActivityPanel_module_css_default.taskDetailSubject,
									title: detailTask.subject,
									children: detailTask.subject.replace(/^开发\s*/u, "")
								}),
								(0, react_jsx_runtime.jsx)("span", {
									className: ActivityPanel_module_css_default.taskDetailBadge,
									"data-state": discarded ? "cancelled" : taskTone(detailTask.state, detailTask.status),
									children: discarded ? t("task.status.notRun") : taskStatusLabel(detailTask.status, t)
								})
							]
						}),
						(0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.taskDetailLine,
							children: [
								detailTask.assignee || t("task.assignee.unclaimed"),
								" · ",
								discarded ? t("task.detail.notRun") : detailTask.status === "completed" ? t("task.detail.completed") : detailTask.status === "cancelled" ? t("task.detail.cancelled") : detailTask.status === "failed" ? t("task.detail.failed") : detailTask.dependencies.length === 0 ? t("task.detail.noPrerequisite") : waitingOn.length === 0 ? t("task.detail.ready") : t("task.detail.waitingOn", { tasks: formatTaskIds(waitingOn, t) })
							]
						}),
						detailModel !== "" && (0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.taskDetailModel,
							"data-task-model": detailModel,
							children: t("task.model", { model: detailModel })
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.taskDetailMeta,
							children: dependents.length === 0 ? t("task.detail.noDownstream") : t("task.detail.unlocks", { tasks: formatTaskIds(dependents.map((task) => task.id), t) })
						})
					]
				})] })]
			});
		}
		function TeamSection({ team, modelDirectory, onContinuePlanning, onDiscarded, onNavigate, t, historic = false, workspace = false }) {
			const [selectedTaskId, setSelectedTaskId] = (0, react.useState)(null);
			const [editingMember, setEditingMember] = (0, react.useState)();
			const selectedAssignee = team.tasks.find((task) => task.id === selectedTaskId)?.assignee;
			const [membersOpen, setMembersOpen] = (0, react.useState)(workspace);
			const [stopOpen, setStopOpen] = (0, react.useState)(false);
			const [stopping, setStopping] = (0, react.useState)(false);
			const [stopError, setStopError] = (0, react.useState)("");
			const discarded = historic && team.phase === "staged";
			const stopped = !historic && team.halted === true;
			const busyCount = team.members.filter((member) => member.activity === "working").length;
			const assignedCount = team.tasks.filter((task) => task.assignee !== "" && task.assignee !== CAPTAIN_ASSIGNEE).length;
			const captainOwned = team.tasks.filter((task) => task.assignee === CAPTAIN_ASSIGNEE && task.status !== "completed" && task.status !== "failed" && task.status !== "cancelled");
			const captainBusy = captainOwned.length > 0;
			const captainTaskIds = formatTaskIds(captainOwned.map((task) => task.id), t);
			const completedCount = team.tasks.filter((task) => task.status === "completed").length;
			const allCompleted = team.tasks.length > 0 && completedCount === team.tasks.length;
			const allSettled = team.tasks.length > 0 && team.tasks.every((task) => task.status === "completed" || task.status === "failed" || task.status === "cancelled");
			const unfinishedCount = team.tasks.filter((task) => task.status !== "completed" && task.status !== "failed" && task.status !== "cancelled").length;
			const canStop = !historic && team.phase === "running" && team.halted !== true && teamIsActive(team);
			const stopTeam = async () => {
				if (stopping) return;
				setStopping(true);
				setStopError("");
				try {
					const response = await fetch(ACTIVITY_HALT_URL, {
						method: "POST",
						cache: "no-store",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							sessionId: team.captainSessionId,
							teamId: team.teamId
						})
					});
					if (!response.ok) {
						let message = t("team.stopRequestFailed");
						try {
							const body = await response.json();
							if (typeof body.error === "string" && body.error.trim() !== "") message = body.error;
						} catch {}
						throw new Error(message);
					}
					setStopOpen(false);
				} catch (error) {
					setStopError(t("team.stopFailed", { message: error instanceof Error ? error.message : String(error) }));
				} finally {
					setStopping(false);
				}
			};
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("section", {
				className: ActivityPanel_module_css_default.team,
				"data-team-id": team.teamId,
				"data-workspace-team": workspace || void 0,
				children: [
					(0, react_jsx_runtime.jsxs)("header", {
						className: ActivityPanel_module_css_default.teamHead,
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.teamName,
								title: team.name,
								children: team.name
							}),
							historic && (0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.historicPill,
								children: t(discarded ? "team.discarded" : "team.ended")
							}),
							stopped && (0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.historicPill,
								children: t("team.stopped")
							}),
							(0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.teamStats,
								children: [
									(0, react_jsx_runtime.jsx)("span", {
										"data-stat": "members",
										children: t("team.stats.members", { count: team.members.length })
									}),
									(0, react_jsx_runtime.jsx)("span", {
										"data-stat": "tasks",
										children: t("team.stats.completed", {
											completed: completedCount,
											total: team.tasks.length
										})
									}),
									(0, react_jsx_runtime.jsx)("span", {
										"data-stat": "messages",
										children: t("team.stats.messages", { count: team.messageCount })
									})
								]
							}),
							canStop && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ActivityPanel_module_css_default.teamStopButton,
								"aria-label": t("team.stop"),
								title: t("team.stop"),
								onClick: () => {
									setStopError("");
									setStopOpen(true);
								},
								children: (0, react_jsx_runtime.jsx)(IconStopFill16, {})
							})
						]
					}),
					team.phase === "staged" && !team.workflowEnabled && !historic && modelDirectory !== void 0 && onContinuePlanning !== void 0 && onDiscarded !== void 0 && (0, react_jsx_runtime.jsx)(StagingPlanEditor, {
						team,
						modelDirectory,
						onContinuePlanning,
						onDiscarded,
						t
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: ActivityPanel_module_css_default.delegationSection,
						"aria-label": t("delegation.aria"),
						"data-delegation-map": true,
						children: [
							(0, react_jsx_runtime.jsxs)("div", {
								className: ActivityPanel_module_css_default.captainNode,
								children: [
									(0, react_jsx_runtime.jsx)("span", {
										className: ActivityPanel_module_css_default.captainAvatar,
										children: (0, react_jsx_runtime.jsx)("img", {
											className: ActivityPanel_module_css_default.leadAvatar,
											src: LEAD_ART,
											alt: "",
											"aria-hidden": true
										})
									}),
									(0, react_jsx_runtime.jsxs)("span", {
										className: ActivityPanel_module_css_default.captainInfo,
										children: [(0, react_jsx_runtime.jsxs)("span", {
											className: ActivityPanel_module_css_default.captainLine,
											children: [(0, react_jsx_runtime.jsx)("span", {
												className: ActivityPanel_module_css_default.captainName,
												children: t("captain.name")
											}), (0, react_jsx_runtime.jsx)("span", {
												className: ActivityPanel_module_css_default.captainRole,
												children: t("captain.role")
											})]
										}), (0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.captainSummary,
											children: discarded ? t("captain.summary.discarded", {
												tasks: team.tasks.length,
												members: team.members.length
											}) : captainBusy ? t("captain.summary.withTakeover", {
												tasks: assignedCount,
												captainTasks: captainTaskIds
											}) : team.phase === "staged" ? t(team.planReviewState === "awaiting_feedback" ? "captain.summary.awaitingFeedback" : "captain.summary.staged", {
												tasks: team.tasks.length,
												members: team.members.length
											}) : t("captain.summary", {
												tasks: assignedCount,
												members: team.members.length
											})
										})]
									}),
									(0, react_jsx_runtime.jsxs)("span", {
										className: ActivityPanel_module_css_default.captainState,
										"data-busy": captainBusy || busyCount > 0,
										children: [(0, react_jsx_runtime.jsx)(WorkGlyph, { active: captainBusy || busyCount > 0 }), discarded ? t("captain.state.discarded") : captainBusy ? t("captain.state.takeover", { tasks: captainTaskIds }) : team.phase === "staged" ? t(team.planReviewState === "awaiting_feedback" ? "captain.state.awaitingFeedback" : "captain.state.staged") : busyCount > 0 ? t("captain.state.working", { count: busyCount }) : t(allCompleted ? "captain.state.collected" : allSettled ? "captain.state.settled" : "captain.state.waiting")]
									})
								]
							}),
							(0, react_jsx_runtime.jsx)(ProgressOverview, {
								team,
								t,
								discarded
							}),
							(() => {
								const orderedMembers = orderDelegationMembers(team.members, team.tasks);
								const runningMembers = orderedMembers.filter((member) => member.activity === "working" || member.status === "working" || team.tasks.some((task) => task.assignee === member.name && (task.status === "pending" || task.status === "claimed" || task.status === "in_progress")));
								const visibleMembers = membersOpen ? orderedMembers : runningMembers;
								const hiddenFinishedCount = orderedMembers.length - visibleMembers.length;
								const expandLabel = membersOpen ? t("members.collapse") : hiddenFinishedCount > 0 ? t("members.expandFinished", { count: hiddenFinishedCount }) : t("members.expand");
								return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: ActivityPanel_module_css_default.membersToggle,
									onClick: () => {
										setMembersOpen((current) => !current);
									},
									"aria-expanded": membersOpen,
									"data-members-toggle": true,
									children: [(0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsx)(Chevron, { open: membersOpen }), t("members.toggle", { count: team.members.length })] }), (0, react_jsx_runtime.jsx)("span", { children: expandLabel })]
								}), (membersOpen || visibleMembers.length > 0) && (0, react_jsx_runtime.jsxs)("div", {
									className: ActivityPanel_module_css_default.delegationTree,
									children: [team.members.length === 0 && (0, react_jsx_runtime.jsx)("span", {
										className: ActivityPanel_module_css_default.emptyHint,
										children: t("members.empty")
									}), visibleMembers.map((member) => {
										const owned = team.tasks.filter((task) => task.assignee === member.name);
										const memberModel = memberRouteLabel(member);
										return (0, react_jsx_runtime.jsxs)("div", {
											className: ActivityPanel_module_css_default.memberBlock,
											"data-activity": member.activity,
											"data-selected-member": editingMember === member.name || workspace && selectedAssignee === member.name || void 0,
											children: [
												(0, react_jsx_runtime.jsx)("span", {
													className: ActivityPanel_module_css_default.memberBranch,
													"aria-hidden": true,
													children: (0, react_jsx_runtime.jsx)("span", {})
												}),
												(0, react_jsx_runtime.jsxs)("button", {
													type: "button",
													className: ActivityPanel_module_css_default.memberRow,
													"data-activity": member.activity,
													onClick: () => {
														if (!historic && modelDirectory) setEditingMember((value) => value === member.name ? void 0 : member.name);
														else if (member.id !== "") onNavigate(team.captainSessionId, member.id);
													},
													children: [
														(0, react_jsx_runtime.jsxs)("span", {
															className: ActivityPanel_module_css_default.memberAvatar,
															"data-unread": member.unread > 0,
															children: [memberArtUrl(member.name, member.role) !== null ? (0, react_jsx_runtime.jsx)("img", {
																className: ActivityPanel_module_css_default.memberArt,
																src: memberArtUrl(member.name, member.role) ?? "",
																alt: "",
																"aria-hidden": true
															}) : (0, react_jsx_runtime.jsx)("span", {
																className: ActivityPanel_module_css_default.memberInitial,
																style: { background: accentOf(member.id) },
																children: memberInitial(member.name)
															}), (0, react_jsx_runtime.jsx)("img", {
																className: ActivityPanel_module_css_default.stateArt,
																"data-activity": member.activity,
																src: ACTION_ART[member.activity],
																alt: "",
																"aria-hidden": true
															})]
														}),
														(0, react_jsx_runtime.jsxs)("span", {
															className: ActivityPanel_module_css_default.memberInfo,
															children: [(0, react_jsx_runtime.jsxs)("span", {
																className: ActivityPanel_module_css_default.memberLine,
																children: [
																	(0, react_jsx_runtime.jsx)("span", {
																		className: ActivityPanel_module_css_default.memberName,
																		children: member.name
																	}),
																	member.role !== "" && (0, react_jsx_runtime.jsx)("span", {
																		className: ActivityPanel_module_css_default.memberRole,
																		children: member.role
																	}),
																	memberModel !== "" && (0, react_jsx_runtime.jsx)("span", {
																		className: ActivityPanel_module_css_default.memberModel,
																		role: "img",
																		"data-member-model": memberModel,
																		title: memberModel,
																		"aria-label": memberModel,
																		children: compactModelLabel(memberModel)
																	}),
																	(0, react_jsx_runtime.jsxs)("span", {
																		className: ActivityPanel_module_css_default.memberState,
																		"data-activity": member.activity,
																		children: [(0, react_jsx_runtime.jsx)(WorkGlyph, { active: member.activity === "working" }), discarded ? t("member.state.notCreated") : stopped ? t("member.state.stopped") : team.phase === "staged" ? t("member.state.staged") : memberStateLabel(member, team.tasks, historic, t)]
																	})
																]
															}), (0, react_jsx_runtime.jsx)("span", {
																className: ActivityPanel_module_css_default.memberStatusLine,
																children: discarded ? t("member.status.discarded") : stopped ? t("member.status.stopped") : team.phase === "staged" ? t("member.status.staged") : historic && owned.length > 0 && owned.every((task) => task.status === "completed" || task.status === "failed" || task.status === "cancelled") ? t("member.status.settled") : memberStatusText(member, team.tasks, t)
															})]
														}),
														(0, react_jsx_runtime.jsxs)("span", {
															className: ActivityPanel_module_css_default.memberCount,
															children: [
																member.done,
																"/",
																member.total
															]
														})
													]
												}),
												editingMember === member.name && modelDirectory && !historic && (0, react_jsx_runtime.jsx)(QuickMemberEditor, {
													team,
													member,
													directory: modelDirectory,
													t,
													close: () => setEditingMember(void 0)
												}, member.name),
												!historic && modelDirectory && member.id !== "" && (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: ActivityPanel_module_css_default.quickTranscript,
													onClick: () => onNavigate(team.captainSessionId, member.id),
													children: "执行对话 ↗"
												}),
												(0, react_jsx_runtime.jsxs)("div", {
													className: ActivityPanel_module_css_default.assignmentLine,
													children: [(0, react_jsx_runtime.jsx)("span", {
														className: ActivityPanel_module_css_default.assignmentLabel,
														children: t(discarded ? "assignment.discarded" : team.phase === "staged" ? "assignment.staged" : "assignment.label")
													}), (0, react_jsx_runtime.jsx)("span", {
														className: ActivityPanel_module_css_default.assignmentTasks,
														children: owned.length === 0 ? (0, react_jsx_runtime.jsx)("span", {
															className: ActivityPanel_module_css_default.taskEmpty,
															children: t("assignment.empty")
														}) : owned.map((task) => {
															const model = taskModelLabel(task, team.members);
															const shortModel = compactModelLabel(model);
															return (0, react_jsx_runtime.jsx)("span", {
																className: ActivityPanel_module_css_default.assignmentChip,
																"data-state": discarded ? "cancelled" : taskTone(task.state, task.status),
																"data-verdict-stale": task.verdictStale === void 0 ? void 0 : "true",
																"data-task-model": model || void 0,
																title: taskTitle(task, model),
																children: task.state === "running" && shortModel !== "" ? `${task.id} · ${shortModel}` : task.id
															}, task.id);
														})
													})]
												})
											]
										}, member.id || member.name);
									})]
								})] });
							})()
						]
					}),
					(0, react_jsx_runtime.jsx)(DependencyMap, {
						tasks: team.tasks,
						members: team.members,
						t,
						discarded,
						workspace,
						onSelectTask: setSelectedTaskId
					}),
					workspace && (0, react_jsx_runtime.jsx)(WorkspaceSummary, {
						team,
						t,
						discarded
					})
				]
			}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: stopOpen,
				onClose: () => {
					if (!stopping) setStopOpen(false);
				},
				title: t("team.stopTitle", { team: team.name }),
				closeLabel: t("plan.cancel"),
				description: t("team.stopDescription", {
					tasks: unfinishedCount,
					members: busyCount
				}),
				footer: (0, react_jsx_runtime.jsxs)("span", {
					className: ActivityPanel_module_css_default.stopModalActions,
					children: [(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: stopping,
						onClick: () => {
							setStopOpen(false);
						},
						children: t("team.stopCancel")
					}), (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						"data-danger": true,
						disabled: stopping,
						onClick: () => {
							stopTeam();
						},
						children: [(0, react_jsx_runtime.jsx)(IconStopFill16, {}), stopping ? t("team.stopping") : t("team.stopConfirm")]
					})]
				}),
				children: stopError !== "" && (0, react_jsx_runtime.jsxs)("p", {
					className: ActivityPanel_module_css_default.stopModalError,
					role: "alert",
					children: [(0, react_jsx_runtime.jsx)(IconWarningOutline16, {}), stopError]
				})
			})] });
		}
		/** Legacy conversation cards may outlive their host archive. Project their
		* durable roster through the same rebuilt panel instead of a second UI. */
		function historicCardTeam(data, owner) {
			return {
				workspace: "",
				teamId: data.teamId,
				name: data.teamName,
				captainSessionId: data.captainSessionId || owner,
				phase: "running",
				members: data.members.map((member) => ({
					...member,
					status: "removed",
					activity: "idle",
					progress: 0,
					done: 0,
					total: 0,
					currentTask: "",
					unread: 0
				})),
				tasks: [],
				messageCount: 0,
				captainInbox: []
			};
		}
		function ActivityPanel({ sessionsList, modelDirectories, openMember, t, conversationVisible = true }) {
			const navigateToSession = (parentId, childId) => {
				setOpen(false);
				setWasActive(false);
				return openMember(parentId, childId);
			};
			const [open, setOpen] = (0, react.useState)(false);
			const [openOwner, setOpenOwner] = (0, react.useState)();
			const [autoOpened, setAutoOpened] = (0, react.useState)(false);
			const [wasActive, setWasActive] = (0, react.useState)(false);
			const [historic, setHistoric] = (0, react.useState)(/* @__PURE__ */ new Map());
			const [layout, setLayout] = (0, react.useState)(initialPanelLayout);
			const [bounds, setBounds] = (0, react.useState)(initialPanelBounds);
			const [interaction, setInteraction] = (0, react.useState)(null);
			const panelRef = (0, react.useRef)(null);
			const boundsRef = (0, react.useRef)(bounds);
			const gestureRef = (0, react.useRef)(null);
			const frameRef = (0, react.useRef)(null);
			const pendingLayoutRef = (0, react.useRef)(null);
			const current = currentSessionId((0, react.useSyncExternalStore)(sessionsList.subscribe, sessionsList.getSnapshot));
			const autoOpenTrackerRef = (0, react.useRef)({
				sessionId: current,
				restoreComplete: false,
				liveTeamIds: /* @__PURE__ */ new Set()
			});
			const monitorTargets = (0, react.useSyncExternalStore)(subscribeActivityMonitorTargets, getActivityMonitorTargetsSnapshot);
			const returnToComposer = () => {
				setOpen(false);
				setOpenOwner(void 0);
				window.requestAnimationFrame(() => {
					document.querySelector("[data-composer-card] [contenteditable=\"true\"][role=\"textbox\"], [data-composer-card] textarea")?.focus();
				});
			};
			const { teams, archivedTeams } = (0, react.useSyncExternalStore)(subscribeActivitySnapshots, getActivitySnapshotsSnapshot);
			const currentTargets = (0, react.useMemo)(() => current === void 0 ? [] : monitorTargets.filter((target) => target.sessionId === current), [current, monitorTargets]);
			const currentRef = (0, react.useRef)(current);
			(0, react.useEffect)(() => {
				currentRef.current = current;
			}, [current]);
			const mountedAtRef = (0, react.useRef)(performance.now());
			const expanded = conversationVisible && activityPanelExpandedForSession(open, openOwner, current);
			const geometry = (0, react.useMemo)(() => resolvePanelGeometry(layout, bounds), [layout, bounds]);
			const compact = compactPanelForBounds(bounds);
			const commitLayout = (0, react.useCallback)((next) => {
				setLayout(next);
			}, []);
			(0, react.useEffect)(() => {
				window.localStorage.setItem(PANEL_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
			}, [layout]);
			(0, react.useLayoutEffect)(() => {
				const overlay = document.querySelector("[data-shell-overlay]");
				if (overlay === null) return;
				const conversation = document.querySelector("[data-phase='active']");
				let frame = null;
				const measure = () => {
					frame = null;
					const overlayRect = overlay.getBoundingClientRect();
					const conversationRect = conversation?.getBoundingClientRect();
					const next = {
						width: overlayRect.width,
						height: overlayRect.height,
						anchorRight: conversationRect === void 0 ? overlayRect.width : Math.min(Math.max(conversationRect.right - overlayRect.left, 0), overlayRect.width)
					};
					const previous = boundsRef.current;
					if (previous.width === next.width && previous.height === next.height && previous.anchorRight === next.anchorRight) return;
					boundsRef.current = next;
					setBounds(next);
				};
				const scheduleMeasure = () => {
					frame ??= requestAnimationFrame(measure);
				};
				measure();
				const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleMeasure);
				observer?.observe(overlay);
				if (conversation !== null) observer?.observe(conversation);
				window.addEventListener("resize", scheduleMeasure);
				return () => {
					if (frame !== null) cancelAnimationFrame(frame);
					observer?.disconnect();
					window.removeEventListener("resize", scheduleMeasure);
				};
			}, [current]);
			(0, react.useLayoutEffect)(() => {
				const tracker = autoOpenTrackerRef.current;
				if (tracker.sessionId !== current) {
					tracker.sessionId = current;
					tracker.restoreComplete = false;
					tracker.liveTeamIds = /* @__PURE__ */ new Set();
					setWasActive(false);
					setAutoOpened(false);
				}
				if (openOwner === void 0 || openOwner === current) return;
				setOpen(false);
				setOpenOwner(void 0);
			}, [current, openOwner]);
			(0, react.useLayoutEffect)(() => {
				const root = document.documentElement;
				if (expanded && geometry.mode === "docked" && !compact) {
					root.setAttribute(PANEL_OPEN_ATTRIBUTE, "");
					root.style.setProperty(PANEL_SHIFT_PROPERTY, `${geometry.width + PANEL_CONVERSATION_GAP + 18}px`);
				} else {
					root.removeAttribute(PANEL_OPEN_ATTRIBUTE);
					root.style.removeProperty(PANEL_SHIFT_PROPERTY);
				}
				return () => {
					root.removeAttribute(PANEL_OPEN_ATTRIBUTE);
					root.style.removeProperty(PANEL_SHIFT_PROPERTY);
				};
			}, [
				compact,
				expanded,
				geometry.mode,
				geometry.width
			]);
			(0, react.useEffect)(() => {
				if (current === void 0) return;
				const controller = startActivityPolling(currentTargets, { discoverySessionId: current });
				let active = true;
				const tracker = autoOpenTrackerRef.current;
				if (tracker.sessionId === current && !tracker.restoreComplete) controller.firstTick.then(() => {
					const latest = autoOpenTrackerRef.current;
					if (!active || latest.sessionId !== current || latest.restoreComplete) return;
					latest.liveTeamIds = new Set(getActivitySnapshotsSnapshot().teams.filter((team) => team.captainSessionId === current).map((team) => team.teamId));
					latest.restoreComplete = true;
				});
				return () => {
					active = false;
					controller.stop();
				};
			}, [current, currentTargets]);
			(0, react.useEffect)(() => {
				const onOpenPanel = (event) => {
					const activeSession = currentRef.current;
					if (activeSession === void 0) return;
					setOpenOwner(activeSession);
					setOpen(true);
					const detail = event.detail;
					if (detail?.teamId !== void 0) {
						const owner = detail.captainSessionId !== "" ? detail.captainSessionId : currentRef.current ?? "";
						const teamKey = `${owner}:${detail.teamId}`;
						setHistoric((previous) => {
							const next = new Map(previous);
							next.set(teamKey, {
								data: detail,
								owner
							});
							return next;
						});
					}
				};
				window.addEventListener(OPEN_PANEL_EVENT, onOpenPanel);
				return () => {
					window.removeEventListener(OPEN_PANEL_EVENT, onOpenPanel);
				};
			}, []);
			const visibleTeams = (0, react.useMemo)(() => current === void 0 ? [] : teams.filter((team) => team.captainSessionId === current), [teams, current]);
			const visibleHistoric = (0, react.useMemo)(() => current === void 0 ? [] : [...historic.values()].filter(({ data, owner }) => owner === current && !teams.some((live) => live.captainSessionId === current && live.teamId === data.teamId) && !archivedTeams.some((archived) => archived.captainSessionId === current && archived.teamId === data.teamId)), [
				historic,
				current,
				teams,
				archivedTeams
			]);
			const visibleArchived = (0, react.useMemo)(() => current === void 0 ? [] : archivedTeams.filter((team) => team.captainSessionId === current && !teams.some((live) => live.captainSessionId === current && live.teamId === team.teamId)), [
				archivedTeams,
				current,
				teams
			]);
			const visibleCount = visibleTeams.length + visibleArchived.length + visibleHistoric.length;
			const visibleLiveTeamIds = (0, react.useMemo)(() => visibleTeams.map((team) => team.teamId).sort(), [visibleTeams]);
			(0, react.useEffect)(() => {
				const tracker = autoOpenTrackerRef.current;
				const settled = performance.now() - mountedAtRef.current >= AUTO_OPEN_SETTLE_MS;
				const shouldAutoExpand = tracker.sessionId === current && activityPanelShouldAutoExpand({
					alreadyAutoOpened: autoOpened,
					pageSettled: settled,
					restoreComplete: tracker.restoreComplete,
					previousLiveTeamIds: tracker.liveTeamIds,
					currentLiveTeamIds: visibleLiveTeamIds
				});
				if (tracker.sessionId === current && tracker.restoreComplete) tracker.liveTeamIds = new Set(visibleLiveTeamIds);
				if (visibleCount > 0) {
					setWasActive(true);
					if (shouldAutoExpand) {
						setOpenOwner(current);
						setOpen(true);
						setAutoOpened(true);
					}
					return;
				}
				if (!wasActive) return;
				const timer = setTimeout(() => {
					setOpen(false);
					setOpenOwner(void 0);
					setWasActive(false);
					setAutoOpened(false);
				}, AUTOCLOSE_GRACE_MS);
				return () => {
					clearTimeout(timer);
				};
			}, [
				visibleCount,
				visibleLiveTeamIds.join("\0"),
				autoOpened,
				wasActive,
				current
			]);
			const busy = (0, react.useMemo)(() => visibleTeams.some((team) => team.members.some((member) => member.activity === "working")), [visibleTeams]);
			const hasTeams = visibleCount > 0;
			const panelGeometryForGesture = (0, react.useCallback)(() => {
				const measuredHeight = panelRef.current?.getBoundingClientRect().height;
				if (measuredHeight === void 0 || measuredHeight <= 0) return geometry;
				return {
					...geometry,
					height: measuredHeight
				};
			}, [geometry]);
			const flushScheduledLayout = (0, react.useCallback)(() => {
				if (frameRef.current !== null) {
					cancelAnimationFrame(frameRef.current);
					frameRef.current = null;
				}
				const pending = pendingLayoutRef.current;
				pendingLayoutRef.current = null;
				if (pending !== null) commitLayout(pending);
			}, [commitLayout]);
			const scheduleLayout = (0, react.useCallback)((next) => {
				pendingLayoutRef.current = next;
				frameRef.current ??= requestAnimationFrame(() => {
					frameRef.current = null;
					const pending = pendingLayoutRef.current;
					pendingLayoutRef.current = null;
					if (pending !== null) commitLayout(pending);
				});
			}, [commitLayout]);
			(0, react.useEffect)(() => () => {
				if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
			}, []);
			const beginMove = (0, react.useCallback)((event) => {
				if (compact || event.button !== 0 || event.target.closest("button") !== null) return;
				event.preventDefault();
				event.currentTarget.setPointerCapture(event.pointerId);
				gestureRef.current = {
					kind: "move",
					pointerId: event.pointerId,
					originX: event.clientX,
					originY: event.clientY,
					start: panelGeometryForGesture(),
					activated: false
				};
			}, [compact, panelGeometryForGesture]);
			const beginResize = (0, react.useCallback)((edge, event) => {
				if (compact || event.button !== 0 || geometry.mode === "docked" && edge !== "left") return;
				event.preventDefault();
				event.stopPropagation();
				event.currentTarget.setPointerCapture(event.pointerId);
				gestureRef.current = {
					kind: "resize",
					edge,
					pointerId: event.pointerId,
					originX: event.clientX,
					originY: event.clientY,
					start: panelGeometryForGesture(),
					activated: true
				};
				setInteraction("resizing");
			}, [
				compact,
				geometry.mode,
				panelGeometryForGesture
			]);
			const updateGesture = (0, react.useCallback)((event) => {
				const gesture = gestureRef.current;
				if (gesture === null || gesture.pointerId !== event.pointerId || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
				const dx = event.clientX - gesture.originX;
				const dy = event.clientY - gesture.originY;
				const activeBounds = boundsRef.current;
				if (gesture.kind === "move") {
					if (!gesture.activated && Math.hypot(dx, dy) < MOVE_THRESHOLD) return;
					if (!gesture.activated) {
						gesture.activated = true;
						setInteraction("dragging");
					}
					scheduleLayout(movePanelLayout(floatPanelLayout(gesture.start, activeBounds), dx, dy, activeBounds));
					return;
				}
				scheduleLayout(resizePanelLayout(gesture.start, gesture.edge ?? "left", dx, dy, activeBounds));
			}, [scheduleLayout]);
			const endGesture = (0, react.useCallback)((event) => {
				const gesture = gestureRef.current;
				if (gesture === null || gesture.pointerId !== event.pointerId) return;
				updateGesture(event);
				flushScheduledLayout();
				if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
				gestureRef.current = null;
				setInteraction(null);
			}, [flushScheduledLayout, updateGesture]);
			const cancelGesture = (0, react.useCallback)((event) => {
				const gesture = gestureRef.current;
				if (gesture === null || gesture.pointerId !== event.pointerId) return;
				flushScheduledLayout();
				gestureRef.current = null;
				setInteraction(null);
			}, [flushScheduledLayout]);
			const toggleDock = (0, react.useCallback)(() => {
				const liveGeometry = panelGeometryForGesture();
				commitLayout(liveGeometry.mode === "docked" ? floatPanelLayout(liveGeometry, boundsRef.current) : dockPanelLayout(liveGeometry, boundsRef.current));
			}, [commitLayout, panelGeometryForGesture]);
			const autoHeight = panelUsesAutoHeight(geometry, bounds);
			const panelStyle = {
				width: geometry.width,
				height: autoHeight ? "auto" : geometry.height,
				maxHeight: panelMaximumHeight(geometry, bounds),
				transform: `translate3d(${geometry.x}px, ${geometry.y}px, 0)`
			};
			if (!conversationVisible || !hasTeams && !expanded) return null;
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [!expanded && (0, react_jsx_runtime.jsx)(CollapsedBadge, {
				count: visibleCount,
				busy,
				t,
				onClick: () => {
					if (current === void 0) return;
					setOpenOwner(current);
					setOpen(true);
				}
			}), expanded && (0, react_jsx_runtime.jsxs)("aside", {
				ref: panelRef,
				className: ActivityPanel_module_css_default.panel,
				style: panelStyle,
				"data-agent-teams-activity": true,
				"data-panel-mode": geometry.mode,
				"data-height-mode": autoHeight ? "auto" : "manual",
				"data-compact": compact || void 0,
				"data-dragging": interaction === "dragging" || void 0,
				"data-resizing": interaction === "resizing" || void 0,
				"aria-label": t("activity.panelAria"),
				children: [
					(0, react_jsx_runtime.jsxs)("header", {
						className: ActivityPanel_module_css_default.panelHead,
						onPointerDown: beginMove,
						onPointerMove: updateGesture,
						onPointerUp: endGesture,
						onPointerCancel: cancelGesture,
						"data-drag-handle": !compact || void 0,
						children: [(0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.panelTitle,
							children: [t("activity.title"), (0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.panelDot,
								"data-busy": busy,
								"aria-hidden": true
							})]
						}), (0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.panelControls,
							children: [!compact && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ActivityPanel_module_css_default.iconButton,
								"data-control": "dock",
								"data-mode": geometry.mode,
								onClick: toggleDock,
								"aria-label": t(geometry.mode === "docked" ? "activity.float" : "activity.dockRight"),
								title: t(geometry.mode === "docked" ? "activity.float" : "activity.dockRight"),
								children: (0, react_jsx_runtime.jsx)(IconPanelLeftOutline16, {})
							}), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ActivityPanel_module_css_default.iconButton,
								"data-control": "collapse",
								onClick: () => {
									setOpen(false);
									setOpenOwner(void 0);
								},
								"aria-label": t("activity.collapse"),
								title: t("activity.collapse"),
								children: (0, react_jsx_runtime.jsx)(IconChevronDownOutline14, {})
							})]
						})]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: ActivityPanel_module_css_default.teams,
						children: [(0, react_jsx_runtime.jsxs)("div", {
							className: ActivityPanel_module_css_default.workflowLaunchers,
							children: [
								current && visibleCount === 0 && (0, react_jsx_runtime.jsx)(WorkflowWorkbench, {
									sessionId: current,
									modelDirectory: modelDirectories.directoryFor(current),
									t,
									openConversation: (id) => openWorkflowConversation(navigateToSession, id),
									openExecution: (id, parentId) => navigateToSession(parentId ?? current, id)
								}, current),
								visibleTeams.map((team) => (0, react_jsx_runtime.jsx)(WorkflowWorkbench, {
									sessionId: team.captainSessionId,
									teamId: team.teamId,
									modelDirectory: modelDirectories.directoryFor(team.captainSessionId),
									t,
									openConversation: (id) => openWorkflowConversation(navigateToSession, id),
									openExecution: (id, parentId) => navigateToSession(parentId ?? team.captainSessionId, id)
								}, team.teamId)),
								visibleArchived.map((team) => (0, react_jsx_runtime.jsx)(WorkflowHistory, {
									name: team.name,
									children: (0, react_jsx_runtime.jsx)(TeamSection, {
										team,
										workspace: true,
										historic: true,
										onNavigate: navigateToSession,
										t
									})
								}, team.teamId)),
								visibleHistoric.map(({ data, owner }) => (0, react_jsx_runtime.jsx)(WorkflowHistory, {
									name: data.teamName,
									children: (0, react_jsx_runtime.jsx)(TeamSection, {
										team: historicCardTeam(data, owner),
										workspace: true,
										historic: true,
										onNavigate: navigateToSession,
										t
									})
								}, data.teamId))
							]
						}), visibleCount === 0 ? (0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.emptyHint,
							children: t("activity.empty")
						}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							visibleTeams.map((team) => (0, react_jsx_runtime.jsx)(TeamSection, {
								team,
								modelDirectory: modelDirectories.directoryFor(team.captainSessionId),
								onContinuePlanning: returnToComposer,
								onDiscarded: returnToComposer,
								onNavigate: navigateToSession,
								t
							}, team.teamId)),
							visibleArchived.map((team) => (0, react_jsx_runtime.jsxs)("div", {
								"data-team-id": team.teamId,
								"data-historic": true,
								className: ActivityPanel_module_css_default.archivedWrap,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: ActivityPanel_module_css_default.archiveLabel,
									children: t(team.phase === "staged" ? "archive.discardedLabel" : "archive.label")
								}), (0, react_jsx_runtime.jsx)(TeamSection, {
									team,
									onNavigate: navigateToSession,
									t,
									historic: true
								})]
							}, `${team.captainSessionId}:${team.teamId}`)),
							visibleHistoric.map(({ data: team, owner }) => {
								const teamKey = `${owner}:${team.teamId}`;
								return (0, react_jsx_runtime.jsx)(TeamSection, {
									team: historicCardTeam(team, owner),
									onNavigate: navigateToSession,
									t,
									historic: true
								}, teamKey);
							})
						] })]
					}),
					!compact && (0, react_jsx_runtime.jsx)("div", {
						className: ActivityPanel_module_css_default.resizeHandle,
						"data-resize-edge": "left",
						onPointerDown: (event) => {
							beginResize("left", event);
						},
						onPointerMove: updateGesture,
						onPointerUp: endGesture,
						onPointerCancel: cancelGesture,
						"aria-hidden": true
					}),
					!compact && geometry.mode === "floating" && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("div", {
						className: ActivityPanel_module_css_default.resizeHandle,
						"data-resize-edge": "bottom",
						onPointerDown: (event) => {
							beginResize("bottom", event);
						},
						onPointerMove: updateGesture,
						onPointerUp: endGesture,
						onPointerCancel: cancelGesture,
						"aria-hidden": true
					}), (0, react_jsx_runtime.jsx)("div", {
						className: ActivityPanel_module_css_default.resizeHandle,
						"data-resize-edge": "corner",
						onPointerDown: (event) => {
							beginResize("corner", event);
						},
						onPointerMove: updateGesture,
						onPointerUp: endGesture,
						onPointerCancel: cancelGesture,
						"aria-hidden": true
					})] })
				]
			})] });
		}
		//#endregion
		//#region lib/client/workspace-state.js
		function createWorkspaceState() {
			let snapshot = {
				statuses: /* @__PURE__ */ new Map(),
				history: /* @__PURE__ */ new Map(),
				selected: /* @__PURE__ */ new Map()
			};
			const listeners = /* @__PURE__ */ new Set();
			const publish = (next) => {
				snapshot = next;
				for (const listener of listeners) listener();
			};
			return {
				getSnapshot: () => snapshot,
				subscribe: (listener) => {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				status(session, status) {
					if (snapshot.statuses.get(session) === status) return;
					publish({
						...snapshot,
						statuses: new Map(snapshot.statuses).set(session, status)
					});
				},
				select(session, team) {
					if (snapshot.selected.get(session) === team) return;
					publish({
						...snapshot,
						selected: new Map(snapshot.selected).set(session, team)
					});
				},
				remember(session, data) {
					const owner = data.captainSessionId || session;
					if (owner !== session) return;
					publish({
						...snapshot,
						history: new Map(snapshot.history).set(`${owner}:${data.teamId}`, {
							...data,
							captainSessionId: owner
						}),
						selected: new Map(snapshot.selected).set(owner, data.teamId)
					});
				}
			};
		}
		/** Records restored at mount never reopen a closed tab; new teams are announced once. */
		function createTeamDiscovery() {
			let restored = false;
			let known = /* @__PURE__ */ new Set();
			return (teams) => {
				const added = restored ? teams.find((team) => !known.has(team.teamId))?.teamId : void 0;
				known = new Set(teams.map((team) => team.teamId));
				restored = true;
				return added;
			};
		}
		//#endregion
		//#region \0dsh-css:G:\dsh_agents\src\client\WorkspaceActivity.module.css.mjs
		const css = "._5zHvXq_root{--dsw-alias-state-business-primary:light-dark(#2866d7,#82b4ff);height:100%;min-height:0;color:var(--dsw-alias-label-primary);background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 78%, var(--dsw-alias-bg-base));font-variant-numeric:tabular-nums;font-family:inherit;overflow:auto;container:_5zHvXq_team-workspace/inline-size}._5zHvXq_content{max-width:1400px;margin:0 auto;padding:16px 14px 28px}._5zHvXq_heading{flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:20px;display:flex}._5zHvXq_heading img{object-fit:contain;width:32px;height:32px}._5zHvXq_heading h2{letter-spacing:-.4px;margin:0;font-size:17px;font-weight:650}._5zHvXq_heading>span{color:var(--dsw-alias-label-secondary);margin-left:auto;font-size:12px}._5zHvXq_selector{flex-wrap:wrap;gap:8px;margin-bottom:18px;display:flex}._5zHvXq_selector button{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);text-align:left;overflow-wrap:anywhere;border-radius:10px;align-items:center;gap:10px;max-width:100%;padding:10px 12px;font-size:12px;transition:background-color .14s,border-color .14s;display:flex}._5zHvXq_selector span{color:var(--dsw-alias-label-secondary);white-space:nowrap;font-size:10px}._5zHvXq_selector button[aria-pressed=true]{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 8%, var(--dsw-alias-bg-layer-1));border-color:var(--dsw-alias-state-business-primary)}._5zHvXq_selector button:hover{border-color:var(--dsw-alias-state-business-primary)}._5zHvXq_root button{cursor:pointer;font-family:inherit}._5zHvXq_selector button,._5zHvXq_empty button,._5zHvXq_error button{color:inherit}._5zHvXq_root button:active{transform:scale(.98)}._5zHvXq_root button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:3px}._5zHvXq_empty{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:18px;padding:32px 24px}._5zHvXq_emptyMark{width:44px;height:44px;color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 8%, transparent);border-radius:13px;place-items:center;font-size:26px;display:grid}._5zHvXq_empty h3{margin:20px 0 10px;font-size:16px;font-weight:600}._5zHvXq_empty p{max-width:45ch;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.8}._5zHvXq_empty button,._5zHvXq_error button{background:var(--dsw-alias-bg-module-platform);border:1px solid var(--dsw-alias-border-l2);border-radius:9px;padding:9px 13px;font-size:12px}._5zHvXq_empty button:hover,._5zHvXq_error button:hover{border-color:var(--dsw-alias-state-business-primary)}._5zHvXq_error{border:1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 30%, var(--dsw-alias-border-l2));background:var(--dsw-alias-bg-layer-1);border-radius:12px;flex-wrap:wrap;align-items:start;gap:12px;margin-bottom:18px;padding:14px;font-size:12px;line-height:1.65;display:flex}._5zHvXq_error>span{flex:180px}._5zHvXq_error button{flex:none}._5zHvXq_skeleton{gap:14px;display:grid}._5zHvXq_skeleton i{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:16px;height:130px;animation:1.8s ease-in-out infinite alternate _5zHvXq_breathe}._5zHvXq_skeleton i:first-child{height:74px}._5zHvXq_skeleton i:last-child{animation-delay:.3s}@keyframes _5zHvXq_breathe{to{opacity:.45}}@container _5zHvXq_team-workspace (width>=720px){._5zHvXq_content{padding:24px 24px 32px}._5zHvXq_heading{margin-bottom:24px}}@media (prefers-reduced-motion:reduce){._5zHvXq_skeleton i{animation:none}._5zHvXq_root button{transition:none}}";
		const tagId = "@yogurtss/dsh-teamflow/WorkspaceActivity.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@yogurtss/dsh-teamflow";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var WorkspaceActivity_module_css_default = {
			"breathe": "_5zHvXq_breathe",
			"content": "_5zHvXq_content",
			"empty": "_5zHvXq_empty",
			"emptyMark": "_5zHvXq_emptyMark",
			"error": "_5zHvXq_error",
			"heading": "_5zHvXq_heading",
			"root": "_5zHvXq_root",
			"selector": "_5zHvXq_selector",
			"skeleton": "_5zHvXq_skeleton",
			"team-workspace": "_5zHvXq_team-workspace"
		};
		//#endregion
		//#region lib/client/WorkspaceActivity.js
		/** Native workspace content; discovery remains mounted independently of tab lifetime. */
		const TEAM_TAB_KIND = "agent-teams";
		const TEAM_TAB_ID = "@yogurtss/dsh-teamflow/activity";
		/** Optional host integration is observable so installing/removing it also switches the fallback. */
		function createWorkspaceBridge() {
			let sidebar;
			const listeners = /* @__PURE__ */ new Set();
			return {
				getSnapshot: () => sidebar,
				subscribe: (listener) => {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				set(value) {
					sidebar = value;
					for (const listener of listeners) listener();
				}
			};
		}
		function ActivitySurface({ bridge, state, ...props }) {
			const sidebar = (0, react.useSyncExternalStore)(bridge.subscribe, bridge.getSnapshot);
			return sidebar === void 0 ? (0, react_jsx_runtime.jsx)(ActivityPanel, { ...props }) : (0, react_jsx_runtime.jsx)(WorkspaceMonitor, {
				...props,
				sidebar,
				state
			});
		}
		function WorkspaceMonitor({ sessionsList, sidebar, state }) {
			const current = currentSessionId((0, react.useSyncExternalStore)(sessionsList.subscribe, sessionsList.getSnapshot));
			const targets = (0, react.useSyncExternalStore)(subscribeActivityMonitorTargets, getActivityMonitorTargetsSnapshot);
			const currentTargets = (0, react.useMemo)(() => targets.filter((target) => target.sessionId === current), [targets, current]);
			const discover = (0, react.useMemo)(() => createTeamDiscovery(), [current]);
			(0, react.useEffect)(() => {
				if (current === void 0) return;
				state.status(current, "loading");
				const controller = startActivityPolling(currentTargets, {
					discoverySessionId: current,
					onStatus(status) {
						state.status(current, status);
					},
					publishSnapshots(update) {
						updateActivitySnapshots(update);
						if (update.teams === void 0) return;
						const added = discover(update.teams.filter((team) => team.captainSessionId === current));
						if (added !== void 0 && sidebar.mounted.getSnapshot() === current && !sidebar.isExpanded()) {
							state.select(current, added);
							sidebar.openTab(TEAM_TAB_KIND);
						}
					}
				});
				return () => {
					controller.stop();
				};
			}, [
				current,
				currentTargets,
				discover,
				sidebar,
				state
			]);
			(0, react.useEffect)(() => {
				const open = (event) => {
					if (current === void 0 || sidebar.mounted.getSnapshot() !== current) return;
					const data = event.detail;
					if (data?.captainSessionId && data.captainSessionId !== current) return;
					if (data?.teamId) state.remember(current, data);
					sidebar.openTab(TEAM_TAB_KIND);
				};
				window.addEventListener(OPEN_PANEL_EVENT, open);
				return () => {
					window.removeEventListener(OPEN_PANEL_EVENT, open);
				};
			}, [
				current,
				sidebar,
				state
			]);
			return null;
		}
		function WorkspaceActivity({ sessionId, useTabInfo, t, state, modelDirectories, openMember, openContext }) {
			const { tab } = useTabInfo();
			const snapshots = (0, react.useSyncExternalStore)(subscribeActivitySnapshots, getActivitySnapshotsSnapshot);
			const local = (0, react.useSyncExternalStore)(state.subscribe, state.getSnapshot);
			const [retry, setRetry] = (0, react.useState)(0);
			const [isNativeContext, setIsNativeContext] = (0, react.useState)(false);
			const live = snapshots.teams.filter((team) => team.captainSessionId === sessionId);
			const archived = snapshots.archivedTeams.filter((team) => team.captainSessionId === sessionId && !live.some((item) => item.teamId === team.teamId));
			const historic = [...local.history.values()].filter((team) => team.captainSessionId === sessionId && !live.some((item) => item.teamId === team.teamId) && !archived.some((item) => item.teamId === team.teamId)).map((team) => historicCardTeam(team, sessionId));
			const records = [
				...live,
				...archived,
				...historic
			];
			const selected = records.find((team) => team.teamId === local.selected.get(sessionId)) ?? records[0];
			const history = selected !== void 0 && !live.includes(selected);
			const status = local.statuses.get(sessionId) ?? "loading";
			(0, react.useEffect)(() => {
				if (retry === 0 || !tab.visible) return;
				const controller = startActivityPolling([], {
					discoverySessionId: sessionId,
					onStatus: (value) => state.status(sessionId, value)
				});
				controller.firstTick.finally(() => {
					controller.stop();
				});
				return () => {
					controller.stop();
				};
			}, [
				retry,
				sessionId,
				state,
				tab.visible
			]);
			const backToChat = () => {
				tab.actions.close();
				requestAnimationFrame(() => document.querySelector("[data-composer-card] [contenteditable=\"true\"][role=\"textbox\"], [data-composer-card] textarea")?.focus());
			};
			return (0, react_jsx_runtime.jsx)("div", {
				className: WorkspaceActivity_module_css_default.root,
				"data-agent-teams-workspace": true,
				"data-session-id": sessionId,
				children: (0, react_jsx_runtime.jsxs)("div", {
					className: WorkspaceActivity_module_css_default.content,
					children: [
						(0, react_jsx_runtime.jsxs)("header", {
							className: WorkspaceActivity_module_css_default.heading,
							children: [
								(0, react_jsx_runtime.jsx)("img", {
									src: LEAD_ART,
									alt: "",
									"aria-hidden": true
								}),
								(0, react_jsx_runtime.jsx)("h2", { children: "TeamFlow" }),
								(0, react_jsx_runtime.jsx)("span", { children: t("workspace.title") })
							]
						}),
						history && selected && (0, react_jsx_runtime.jsx)(WorkflowHistory, {
							name: selected.name,
							children: (0, react_jsx_runtime.jsx)(TeamSection, {
								team: selected,
								workspace: true,
								historic: true,
								onNavigate: openMember,
								t
							})
						}),
						!history && (0, react_jsx_runtime.jsx)(WorkflowWorkbench, {
							sessionId,
							teamId: selected?.teamId,
							embeddedContext: true,
							onNativeContext: setIsNativeContext,
							openContext,
							modelDirectory: modelDirectories.directoryFor(sessionId),
							t,
							waitingCount: selected?.phase !== "staged" && !selected?.halted ? selected?.tasks.filter((task) => task.checkpoint && !task.checkpoint.decision && task.status === "pending" && task.dependencies.every((id) => selected.tasks.some((t) => t.id === id && t.status === "completed"))).length : 0,
							openConversation: (id) => openWorkflowConversation(openMember, id),
							openExecution: (id, parentId) => openMember(parentId ?? sessionId, id)
						}, sessionId),
						!isNativeContext && status === "error" && (0, react_jsx_runtime.jsxs)("div", {
							className: WorkspaceActivity_module_css_default.error,
							role: "alert",
							children: [(0, react_jsx_runtime.jsx)("span", { children: t("workspace.error") }), (0, react_jsx_runtime.jsx)("button", {
								onClick: () => setRetry((value) => value + 1),
								children: t("workspace.retry")
							})]
						}),
						records.length > 1 && (0, react_jsx_runtime.jsx)("nav", {
							className: WorkspaceActivity_module_css_default.selector,
							"aria-label": t("workspace.title"),
							children: records.map((team) => (0, react_jsx_runtime.jsxs)("button", {
								"aria-pressed": selected?.teamId === team.teamId,
								onClick: () => state.select(sessionId, team.teamId),
								children: [team.name, (0, react_jsx_runtime.jsx)("span", { children: t(live.includes(team) ? "workspace.current" : "workspace.history") })]
							}, team.teamId))
						}),
						selected === void 0 ? isNativeContext ? null : status === "loading" ? (0, react_jsx_runtime.jsxs)("div", {
							className: WorkspaceActivity_module_css_default.skeleton,
							role: "status",
							"aria-label": t("workspace.loading"),
							children: [
								(0, react_jsx_runtime.jsx)("i", {}),
								(0, react_jsx_runtime.jsx)("i", {}),
								(0, react_jsx_runtime.jsx)("i", {})
							]
						}) : (0, react_jsx_runtime.jsxs)("section", {
							className: WorkspaceActivity_module_css_default.empty,
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									className: WorkspaceActivity_module_css_default.emptyMark,
									"aria-hidden": true,
									children: "↳"
								}),
								(0, react_jsx_runtime.jsx)("h3", { children: t("workspace.emptyTitle") }),
								(0, react_jsx_runtime.jsx)("p", { children: t("workspace.emptyBody") }),
								(0, react_jsx_runtime.jsx)("button", {
									onClick: backToChat,
									children: t("workspace.back")
								})
							]
						}) : (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: (0, react_jsx_runtime.jsx)(TeamSection, {
							team: selected,
							workspace: true,
							historic: history,
							modelDirectory: !history ? modelDirectories.directoryFor(sessionId) : void 0,
							onContinuePlanning: backToChat,
							onDiscarded: backToChat,
							onNavigate: openMember,
							t
						}, `${sessionId}:${selected.teamId}`) })
					]
				})
			});
		}
		//#endregion
		//#region lib/client/agent-teams-card-definition.js
		/**
		* AgentTeams conversation card: a lightweight in-conversation summary shown
		* when a team is created — the captain's name, the member roster with whale
		* avatars, and an entry point that re-activates the top-right activity
		* panel (useful after the floater was closed, or when re-opening an old
		* session for review).
		*
		* The fold anchors to the Harness's durable `tool/call` + `tool/result`
		* records for `agent_teams_create`. Those are first-party session events, so
		* the card survives restarts without writing an out-of-repo event type.
		* @module dsh-agent-teams/client/card
		*/
		/**
		* Fold a team name the way the host's `sanitizeKey` does, minus the host's
		* digest fallback. The host keeps Unicode letters and digits, so an ASCII-only
		* client derivation turned every CJK name into the shared `team` key and the
		* card could never match its live team (issue #203). Names with no letters or
		* digits at all, and names longer than the host's key limit, still need the
		* host's canonical id; the create result now carries it.
		* @param name - the create call's team name.
		* @returns the host-shaped key for the name.
		*/
		function teamKeyFromName(name) {
			const cleaned = name.normalize("NFC").trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
			return cleaned === "" ? "team" : cleaned;
		}
		/** Parse the only create-call fields the historic card owns. */
		function parseAgentTeamsCreateArgs(value) {
			try {
				const parsed = JSON.parse(value);
				if (typeof parsed !== "object" || parsed === null || !("name" in parsed) || typeof parsed.name !== "string") return;
				const name = parsed.name.trim();
				if (name === "") return void 0;
				return {
					teamId: teamKeyFromName(name),
					name
				};
			} catch {
				return;
			}
		}
		/**
		* Read the canonical identity the host attaches to the `agent_teams_create`
		* result. Records written before the host published it carry no metadata, so
		* an absent or malformed payload falls back to the client derivation.
		* @param meta - the durable `tool/result` metadata payload, if any.
		* @returns the canonical identity, or `undefined` when the host published none.
		*/
		function parseAgentTeamsCreateResult(meta) {
			if (typeof meta !== "object" || meta === null) return void 0;
			const record = meta;
			const teamId = typeof record.team_id === "string" ? record.team_id.trim() : "";
			if (teamId === "") return void 0;
			const captainSessionId = typeof record.captain_session_id === "string" ? record.captain_session_id.trim() : "";
			const members = [];
			if (Array.isArray(record.members)) for (const entry of record.members) {
				if (typeof entry !== "object" || entry === null) continue;
				const member = entry;
				const name = typeof member.name === "string" ? member.name : "";
				if (name === "") continue;
				members.push({
					id: typeof member.id === "string" ? member.id : "",
					name,
					role: typeof member.role === "string" ? member.role : ""
				});
			}
			return {
				teamId,
				captainSessionId,
				members
			};
		}
		/**
		* Read the canonical team id out of a `tool/result` recorded before the host
		* published {@link parseAgentTeamsCreateResult}'s metadata. Both historic
		* renderings carry it and have been stable since they were introduced:
		* `Team "<name>" created (id <canonical>) under <state_dir>. You are the
		* captain.` and the staged `Team "<name>" plan created under <state_dir>. It is
		* staged: …`, whose `state_dir` ends in the canonical id. This is the only
		* legacy path for names the client cannot re-derive (host digest fallback,
		* over-long names). Matches are taken right-to-left because the team name sits
		* in front of the canonical segment and may itself contain a look-alike.
		* @param text - the concatenated text blocks of one successful create result.
		* @returns the canonical id, or `undefined` when the text carries none.
		*/
		function teamIdFromCreateResultText(text) {
			const created = [...text.matchAll(/" created \(id ([^()\s]+)\) under /gu)].at(-1)?.[1];
			if (created !== void 0 && created !== "") return created;
			const stagedPath = [...text.matchAll(/plan created under (.+?)\. It is staged: /gu)].at(-1)?.[1];
			if (stagedPath === void 0) return void 0;
			const segment = stagedPath.split(/[\\/]/u).filter((part) => part !== "").at(-1);
			return segment === void 0 || segment === "" ? void 0 : segment;
		}
		/** Durable first-party tool events folded into one keyed Chat node. */
		const agentTeamsCardDefinition = {
			kind: "agent-teams",
			target: "chat",
			match: (event) => {
				if (event.type === "tool/call" && event.data.name === "agent_teams_create") return parseAgentTeamsCreateArgs(event.data.arguments) === void 0 ? null : {
					id: String(event.data.callId),
					role: "start"
				};
				if (event.type === "tool/result" && event.data.message.source.kind === "tool") return {
					id: String(event.data.message.source.callId),
					role: "update"
				};
				return null;
			},
			start: (_context, match) => {
				if (match.event.type !== "tool/call") throw new Error("agent-teams card start requires agent_teams_create tool/call");
				const parsed = parseAgentTeamsCreateArgs(match.event.data.arguments);
				if (parsed === void 0) throw new Error("agent-teams card start requires valid create arguments");
				return {
					...parsed,
					accepted: false,
					captainSessionId: "",
					members: []
				};
			},
			update: (context, match) => {
				if (match.event.type !== "tool/result") return context.state;
				if (match.event.data.error !== void 0 || toolResultFailed(match.event.data.message)) return context.state;
				const canonical = parseAgentTeamsCreateResult(match.event.data.meta);
				const legacyId = canonical === void 0 ? teamIdFromCreateResultText(resultText(match.event.data.message)) : void 0;
				if (canonical === void 0 && legacyId === void 0) return {
					...context.state,
					accepted: true
				};
				return {
					...context.state,
					accepted: true,
					teamId: canonical?.teamId ?? legacyId ?? context.state.teamId,
					captainSessionId: canonical?.captainSessionId ?? "",
					members: canonical?.members ?? []
				};
			},
			buildViewNode: (context) => {
				if (context.start === void 0) return null;
				const state = context.state;
				if (!state.accepted) return null;
				return {
					key: context.key,
					kind: "agent-teams",
					id: context.id,
					target: "chat",
					anchorSeq: context.start.event.seq,
					location: context.start.location,
					visibility: "visible",
					data: {
						teamId: state.teamId,
						captainSessionId: state.captainSessionId,
						teamName: state.name,
						members: state.members
					}
				};
			}
		};
		/** Concatenate the text blocks of one durable tool-result message. */
		function resultText(message) {
			return message.content.filter((block) => typeof block === "object" && block !== null && "type" in block && block.type === "text" && "text" in block && typeof block.text === "string").map((block) => block.text).join("\n");
		}
		/** V4 tool-role results carry isError directly; older logs nest tool-result blocks. */
		function toolResultFailed(message) {
			return message.isError === true || message.content.some((block) => typeof block === "object" && block !== null && "type" in block && block.type === "tool-result" && "isError" in block && block.isError === true);
		}
		/** Keep summaries tied to the create turn, including multiple teams in one turn. */
		function teamCardsForTurn(nodes, turn) {
			return [...nodes].filter((node) => node.kind === "agent-teams" && (node.location.kind === "turn" || node.location.kind === "step") && node.location.turn.turn === turn);
		}
		//#endregion
		//#region lib/client/TeamChatEntry.js
		/** Session-owned entry points: a persistent title action and a durable turn card. */
		function TeamChatEntry({ sessionId, t, openMember, openContext }) {
			const { teams, archivedTeams } = (0, react.useSyncExternalStore)(subscribeActivitySnapshots, getActivitySnapshotsSnapshot);
			const team = [...teams, ...archivedTeams].find((team) => team.captainSessionId === sessionId);
			if (!team) return (0, react_jsx_runtime.jsx)(WorkflowWorkbench, {
				sessionId,
				nativeOnly: true,
				openContext,
				openConversation: openMember ? (id) => openWorkflowConversation(openMember, id) : void 0,
				openExecution: (id, parentId) => openMember?.(parentId ?? sessionId, id)
			}, sessionId);
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("button", {
				className: AgentTeamsCard_module_css_default.chatEntry,
				"data-team-chat-entry": true,
				type: "button",
				title: t("workspace.focus"),
				onClick: () => openActivityPanel({
					teamId: team.teamId,
					captainSessionId: sessionId,
					teamName: team.name,
					members: team.members
				}),
				children: [(0, react_jsx_runtime.jsx)("img", {
					src: LEAD_ART,
					alt: "",
					"aria-hidden": true
				}), t("workspace.focus")]
			}), (0, react_jsx_runtime.jsx)(WorkflowWorkbench, {
				sessionId,
				teamId: team.teamId,
				reviewEntryOnly: true,
				openConversation: openMember ? (id) => openWorkflowConversation(openMember, id) : void 0
			}, sessionId)] });
		}
		function TeamTurnCard({ sessionId, turn, useChat, t, openMember }) {
			const cards = teamCardsForTurn(useChat((snapshot) => snapshot.nodes).values(), turn.turn);
			if (turn.status !== "closed" || cards.length === 0) return null;
			return (0, react_jsx_runtime.jsx)("div", {
				className: AgentTeamsCard_module_css_default.turnCards,
				"data-team-turn-cards": true,
				children: cards.map((node) => (0, react_jsx_runtime.jsx)(AgentTeamsSummary, {
					data: node.data,
					sessionId,
					t,
					openMember
				}, node.key))
			});
		}
		//#endregion
		//#region lib/client/locales.js
		/** `agentTeams` namespace dictionaries for every plugin-owned Web surface. */
		/** Dictionary namespace owned by the AgentTeams client plugin. */
		const AGENT_TEAMS_LOCALE_NAMESPACE = "agentTeams";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"workspace.dependencies": "从左到右：完成前置后解锁 · 点击查看详情",
			"workspace.title": "TeamFlow 团队协作",
			"workspace.guide": "查看成员分工、任务依赖与执行进度",
			"workspace.eyebrow": "TEAMFLOW",
			"workspace.description": "队长统筹分工，成员按任务依赖并行协作。",
			"workspace.relationships": "队长协调成员分工；任务连线表示前置依赖。点击任务可定位负责成员。",
			"workspace.emptyTitle": "当前会话还没有团队",
			"workspace.emptyBody": "在聊天中使用 /teamflow 描述目标，确认计划后即可在这里查看协作进度。",
			"workspace.loading": "正在读取团队状态",
			"workspace.error": "暂时无法连接团队服务，正在自动重试。已加载的状态可能不是最新。",
			"workspace.retry": "重新连接",
			"workspace.current": "当前团队",
			"workspace.history": "历史记录",
			"workspace.back": "返回对话",
			"workspace.tasks": "项任务",
			"workspace.members": "名成员",
			"workspace.completed": "已完成",
			"workspace.focus": "查看团队",
			"workspace.noTasks": "等待队长拆解任务",
			"workspace.inbox": "队长收件箱",
			"workspace.inboxHint": "最近 5 条未读消息",
			"workspace.inboxEmpty": "暂无未读消息。成员回报会在这里显示，队长读取后移出。",
			"workspace.taskSummary": "任务完成情况",
			"workspace.verdictStale": "结论已过期",
			"card.memberCount": "{count} 名成员",
			"action.openActivityPanel": "打开活动面板",
			"activity.panelButton": "活动面板",
			"activity.badgeAria": "TeamFlow 活动与历史，{count} 条团队记录",
			"activity.panelAria": "TeamFlow 活动面板",
			"activity.title": "TeamFlow 活动",
			"activity.float": "切换为浮动面板",
			"activity.dockRight": "停靠到右侧",
			"activity.collapse": "收起活动面板",
			"activity.empty": "暂无团队活动",
			"team.stop": "停止团队",
			"team.stopped": "已停止",
			"team.stopTitle": "确认停止“{team}”？",
			"team.stopDescription": "将取消 {tasks} 项未完成任务，并停止 {members} 名正在工作的成员。已完成的结果会保留。",
			"team.stopCancel": "继续运行",
			"team.stopConfirm": "确认停止",
			"team.stopping": "正在停止…",
			"team.stopFailed": "停止失败：{message}",
			"team.stopRequestFailed": "服务器未能停止团队，请重试",
			"team.discarded": "已放弃",
			"format.listSeparator": "、",
			"task.status.pending": "待领取",
			"task.status.claimed": "已认领",
			"task.status.inProgress": "进行中",
			"task.status.completed": "已完成",
			"task.status.failed": "失败",
			"task.status.cancelled": "已取消",
			"task.status.notRun": "未执行",
			"member.state.working": "工作中",
			"member.state.failed": "有失败",
			"member.state.waiting": "等待",
			"member.state.delivered": "已交付",
			"member.state.left": "已离队",
			"member.state.removed": "已移除",
			"member.state.pending": "待执行",
			"member.state.unassigned": "待派工",
			"member.state.staged": "待创建",
			"member.state.notCreated": "未创建",
			"member.state.stopped": "已停止",
			"member.status.executing": "正在执行 {taskId}",
			"member.status.executingModel": "正在执行 {taskId} · {model}",
			"member.status.working": "正在处理已派任务",
			"member.status.waitingOn": "等待 {taskId} · {assignee}",
			"member.status.waitingPrerequisite": "等待前置任务",
			"member.status.waitingAssignment": "等待队长派工",
			"member.status.delivered": "任务已交付",
			"member.status.idle": "待继续执行",
			"member.status.unknown": "状态未知",
			"member.status.staged": "确认后创建并启动",
			"member.status.settled": "任务均已终结",
			"member.status.discarded": "计划已放弃，未创建",
			"member.status.stopped": "团队已停止，需显式恢复",
			"task.assignee.unclaimed": "待认领",
			"task.summary.waitingBreakdown": "等待队长拆解任务",
			"task.summary.staged": "{count} 项计划等待确认",
			"task.summary.discarded": "{count} 项计划已放弃，均未执行",
			"task.summary.allDelivered": "全部 {count} 项任务已交付",
			"task.summary.ended": "终态：{completed} 已交付 · {cancelled} 已取消 · {failed} 失败",
			"task.summary.blockedAndRunning": "{tasks}{more} 等待前置，其余已开工",
			"task.summary.more": " 等 {count} 项",
			"task.summary.running": "{tasks} 正在执行",
			"task.summary.claimed": "已认领：{tasks}",
			"task.summary.ready": "{tasks} 已就绪待开工",
			"task.summary.blocked": "{tasks} 等待前置",
			"task.summary.failedSettled": "{count} 项已失败，自动循环已停止",
			"task.summary.waitingSchedule": "等待下一轮调度",
			"progress.aria": "团队总进度",
			"progress.title": "总进度",
			"progress.running": "■ 进行中 {count}",
			"progress.claimed": "■ 已认领 {count}",
			"progress.blocked": "■ 等待依赖 {count}",
			"progress.delivered": "■ 已交付 {count}",
			"dependency.aria": "任务依赖链",
			"dependency.parallel": "并行任务",
			"dependency.title": "任务依赖",
			"dependency.hint.parallel": "无前后依赖 · 点击查看详情",
			"dependency.hint.chain": "悬停高亮依赖链 · 点击固定",
			"dependency.hint.pinned": "{taskId} 已固定 · Esc 取消",
			"task.runningAria": "运行中",
			"task.model": "{model}",
			"task.detail.cancelled": "任务已取消，不会继续执行",
			"task.detail.failed": "任务失败，等待明确重试",
			"task.detail.completed": "已完成并交付",
			"task.detail.noPrerequisite": "无前置，可立即开工",
			"task.detail.ready": "前置已就绪，可开工",
			"task.detail.waitingOn": "等待 {tasks}",
			"task.detail.notRun": "计划已放弃，任务未执行",
			"task.detail.noDownstream": "无下游任务",
			"task.detail.unlocks": "完成后解锁 {tasks}",
			"team.ended": "已结束",
			"plan.badge": "待确认",
			"plan.title": "执行前计划审查",
			"plan.description": "成员尚未创建、任务尚未调度。可直接调整计划，也可返回对话告诉队长哪里需要修改。",
			"plan.member.role": "角色",
			"plan.member.provider": "Provider",
			"plan.member.model": "模型",
			"plan.member.reasoning": "推理等级",
			"plan.member.reasoningHint": "留空使用默认值；可用 low、medium、high、xhigh 等",
			"plan.model.choose": "选择模型",
			"plan.model.currentUnavailable": "{provider}/{model}（当前目录不可用）",
			"plan.model.route": "路由：{provider}/{model}",
			"plan.model.defaultReasoning": "默认推理等级",
			"plan.model.providerDefault": "Provider 默认值",
			"plan.model.modelDefault": "模型默认值（{effort}）",
			"plan.model.triggerAria": "选择成员模型，当前 {model}，推理等级 {effort}",
			"plan.model.back": "返回",
			"plan.model.loading": "正在加载模型…",
			"plan.model.empty": "暂无可用模型",
			"plan.model.partialFailure": "{count} 个 Provider 的模型目录加载失败",
			"plan.model.retry": "重试",
			"plan.member.prompt": "角色提示词",
			"plan.member.roleFallback": "未设置角色",
			"plan.task.subject": "任务名称",
			"plan.task.description": "任务说明",
			"plan.task.assignee": "负责人",
			"plan.task.dependencies": "依赖任务 ID（逗号分隔）",
			"plan.task.dependenciesHint": "例如 task-1, task-2；不得形成循环依赖",
			"plan.task.unassigned": "共享任务池",
			"plan.unsaved": "未保存",
			"plan.save": "保存",
			"plan.saving": "保存中…",
			"plan.remove": "删除",
			"plan.removed": "任务已删除",
			"plan.removeConfirm": "确认删除",
			"plan.removeWarning": "删除 {task} 后将重新计算依赖关系。",
			"plan.cancel": "取消",
			"plan.addTask": "添加任务",
			"plan.adding": "添加中…",
			"plan.taskAdded": "任务已添加",
			"plan.newTask": "新任务名称",
			"plan.newTaskLabel": "新增计划任务",
			"plan.readySummary": "{members} 名成员 · {tasks} 项任务 · {links} 条依赖",
			"plan.flow.aria": "团队启动流程",
			"plan.flow.review": "审查计划",
			"plan.flow.spawn": "创建成员",
			"plan.flow.run": "开始执行",
			"plan.members.title": "成员与模型路由",
			"plan.members.count": "{count} 名成员",
			"plan.members.empty": "尚未规划成员",
			"plan.tasks.title": "任务与依赖",
			"plan.tasks.count": "{count} 项任务 · {links} 条依赖",
			"plan.tasks.empty": "尚未规划任务",
			"plan.dependencies.none": "无依赖",
			"plan.dependencies.count": "{count} 条依赖",
			"plan.approve": "确认并启动团队",
			"plan.approving": "正在创建成员…",
			"plan.approveTitle": "计划检查完毕？",
			"plan.approveHint": "确认后将创建 {members} 名成员并调度 {tasks} 项任务。",
			"plan.approveConfirmTitle": "确认启动此团队",
			"plan.approveWarning": "启动后不能再在此处编辑成员和依赖。",
			"plan.approveConfirm": "确认启动",
			"plan.continue": "返回对话修改",
			"plan.returnToChat": "回到对话",
			"plan.feedbackTitle": "正在等你说明修改方向",
			"plan.feedbackHint": "队长会在对话中追问；收到你的回复后，只修改这份草案并再次等待确认。",
			"plan.discard": "放弃本次计划",
			"plan.discardConfirmTitle": "放弃本次计划？",
			"plan.discardWarning": "该计划会结束并归档；尚未创建任何成员，也不会执行任务。",
			"plan.discardConfirm": "确认放弃",
			"plan.discarding": "正在放弃…",
			"plan.pendingEdits": "请先保存当前修改，再启动团队。",
			"plan.saved": "计划已保存",
			"plan.failed": "操作失败：{message}",
			"team.stats.members": "{count} 名成员",
			"team.stats.completed": "{completed}/{total} 完成",
			"team.stats.messages": "{count} 条消息",
			"delegation.aria": "队长派工关系",
			"captain.name": "队长",
			"captain.role": "拆解 · 派发 · 汇总",
			"captain.summary": "已派发 {tasks} 项任务给 {members} 名成员",
			"captain.summary.staged": "已规划 {tasks} 项任务与 {members} 名成员，等待确认",
			"captain.summary.awaitingFeedback": "草案已保留，等待你在对话中说明修改方向",
			"captain.summary.discarded": "计划已放弃：{members} 名成员未创建，{tasks} 项任务未执行",
			"captain.summary.withTakeover": "已派发 {tasks} 项给成员 · 队长接管 {captainTasks}",
			"captain.state.working": "{count} 人执行中",
			"captain.state.takeover": "正在执行 {tasks}",
			"captain.state.collected": "已收齐",
			"captain.state.waiting": "等待回报",
			"captain.state.staged": "待确认",
			"captain.state.awaitingFeedback": "待反馈",
			"captain.state.discarded": "已放弃",
			"captain.state.settled": "已终结",
			"members.toggle": "{count} 名成员",
			"members.collapse": "收起",
			"members.expand": "展开",
			"members.expandFinished": "展开已结束（{count}）",
			"members.empty": "暂无成员，等待队长组建团队",
			"assignment.label": "队长派发",
			"assignment.staged": "计划任务",
			"assignment.discarded": "未执行的计划",
			"assignment.empty": "暂无任务",
			"archive.label": "已结束 · 历史归档",
			"archive.discardedLabel": "计划已放弃 · 历史归档"
		};
		/** English dictionary, checked complete against the Chinese source key set. */
		const en = {
			"workspace.dependencies": "Left to right: prerequisites unlock tasks · Select for details",
			"workspace.title": "Team workspace",
			"workspace.guide": "Members, task dependencies, and execution progress",
			"workspace.eyebrow": "TEAMFLOW",
			"workspace.description": "The captain coordinates. Members work in parallel as dependencies clear.",
			"workspace.relationships": "The captain coordinates members. Connections show task prerequisites. Select a task to locate its owner.",
			"workspace.emptyTitle": "No team in this conversation yet",
			"workspace.emptyBody": "Use /teamflow in chat to describe your goal. Review the plan, then follow the team here.",
			"workspace.loading": "Loading team activity",
			"workspace.error": "The team service is unavailable. Retrying automatically; loaded activity may be out of date.",
			"workspace.retry": "Reconnect",
			"workspace.current": "Current team",
			"workspace.history": "History",
			"workspace.back": "Back to conversation",
			"workspace.tasks": "tasks",
			"workspace.members": "members",
			"workspace.completed": "completed",
			"workspace.focus": "View team",
			"workspace.noTasks": "Waiting for the captain to define tasks",
			"workspace.inbox": "Captain inbox",
			"workspace.inboxHint": "Up to 5 recent unread messages",
			"workspace.inboxEmpty": "No unread messages. Member reports appear here until the captain reads them.",
			"workspace.taskSummary": "Task completion summary",
			"workspace.verdictStale": "Verdict outdated",
			"card.memberCount": "{count} members",
			"action.openActivityPanel": "Open activity panel",
			"activity.panelButton": "Activity panel",
			"activity.badgeAria": "TeamFlow activity and history, {count} team records",
			"activity.panelAria": "TeamFlow activity panel",
			"activity.title": "TeamFlow activity",
			"activity.float": "Switch to floating panel",
			"activity.dockRight": "Dock to the right",
			"activity.collapse": "Collapse activity panel",
			"activity.empty": "No team activity",
			"team.stop": "Stop team",
			"team.stopped": "Stopped",
			"team.stopTitle": "Stop “{team}”?",
			"team.stopDescription": "This cancels {tasks} unfinished tasks and stops {members} working members. Completed results are kept.",
			"team.stopCancel": "Keep running",
			"team.stopConfirm": "Stop team",
			"team.stopping": "Stopping…",
			"team.stopFailed": "Could not stop team: {message}",
			"team.stopRequestFailed": "The server could not stop this team. Try again.",
			"team.discarded": "Discarded",
			"format.listSeparator": ", ",
			"task.status.pending": "Unclaimed",
			"task.status.claimed": "Claimed",
			"task.status.inProgress": "In progress",
			"task.status.completed": "Completed",
			"task.status.failed": "Failed",
			"task.status.cancelled": "Cancelled",
			"task.status.notRun": "Not run",
			"member.state.working": "Working",
			"member.state.failed": "Has failures",
			"member.state.waiting": "Waiting",
			"member.state.delivered": "Delivered",
			"member.state.left": "Left team",
			"member.state.removed": "Removed",
			"member.state.pending": "Pending",
			"member.state.unassigned": "Awaiting assignment",
			"member.state.staged": "Not spawned",
			"member.state.notCreated": "Not created",
			"member.state.stopped": "Stopped",
			"member.status.executing": "Working on {taskId}",
			"member.status.executingModel": "Working on {taskId} · {model}",
			"member.status.working": "Working on assigned tasks",
			"member.status.waitingOn": "Waiting for {taskId} · {assignee}",
			"member.status.waitingPrerequisite": "Waiting for prerequisites",
			"member.status.waitingAssignment": "Waiting for the captain to assign work",
			"member.status.delivered": "Tasks delivered",
			"member.status.idle": "Ready to continue",
			"member.status.unknown": "Status unknown",
			"member.status.staged": "Will be spawned after approval",
			"member.status.settled": "All assigned work is settled",
			"member.status.discarded": "Plan discarded; member was not created",
			"member.status.stopped": "Team stopped; explicit resume required",
			"task.assignee.unclaimed": "Unclaimed",
			"task.summary.waitingBreakdown": "Waiting for the captain to break down the work",
			"task.summary.staged": "{count} planned tasks awaiting approval",
			"task.summary.discarded": "{count} planned tasks discarded; none ran",
			"task.summary.allDelivered": "All {count} tasks delivered",
			"task.summary.ended": "Final: {completed} delivered · {cancelled} cancelled · {failed} failed",
			"task.summary.blockedAndRunning": "{tasks}{more} waiting on prerequisites; other work has started",
			"task.summary.more": " and {count} more",
			"task.summary.running": "{tasks} in progress",
			"task.summary.claimed": "Claimed: {tasks}",
			"task.summary.ready": "{tasks} ready to start",
			"task.summary.blocked": "{tasks} waiting on prerequisites",
			"task.summary.failedSettled": "{count} failed; the automatic loop has stopped",
			"task.summary.waitingSchedule": "Waiting for the next scheduling round",
			"progress.aria": "Overall team progress",
			"progress.title": "Overall progress",
			"progress.running": "■ In progress {count}",
			"progress.claimed": "■ Claimed {count}",
			"progress.blocked": "■ Waiting {count}",
			"progress.delivered": "■ Delivered {count}",
			"dependency.aria": "Task dependency chain",
			"dependency.parallel": "Parallel tasks",
			"dependency.title": "Task dependencies",
			"dependency.hint.parallel": "No dependencies · Click for details",
			"dependency.hint.chain": "Hover to highlight dependencies · Click to pin",
			"dependency.hint.pinned": "{taskId} pinned · Esc to clear",
			"task.runningAria": "Running",
			"task.model": "{model}",
			"task.detail.cancelled": "Cancelled; execution will not continue",
			"task.detail.failed": "Failed; awaiting an explicit retry",
			"task.detail.completed": "Completed and delivered",
			"task.detail.noPrerequisite": "No prerequisites; ready to start",
			"task.detail.ready": "Prerequisites ready; can start",
			"task.detail.waitingOn": "Waiting for {tasks}",
			"task.detail.notRun": "Plan discarded; task was not run",
			"task.detail.noDownstream": "No downstream tasks",
			"task.detail.unlocks": "Unlocks {tasks} when complete",
			"team.ended": "Ended",
			"plan.badge": "Awaiting approval",
			"plan.title": "Pre-run plan review",
			"plan.description": "Members have not been spawned and tasks have not been scheduled. Edit the draft here, or return to chat and tell the Captain what should change.",
			"plan.member.role": "Role",
			"plan.member.provider": "Provider",
			"plan.member.model": "Model",
			"plan.member.reasoning": "Reasoning effort",
			"plan.member.reasoningHint": "Leave blank for default; accepts low, medium, high, xhigh, and more",
			"plan.model.choose": "Choose a model",
			"plan.model.currentUnavailable": "{provider}/{model} (not in the current catalog)",
			"plan.model.route": "Route: {provider}/{model}",
			"plan.model.defaultReasoning": "Default reasoning effort",
			"plan.model.providerDefault": "Provider default",
			"plan.model.modelDefault": "Model default ({effort})",
			"plan.model.triggerAria": "Choose member model, currently {model}, reasoning effort {effort}",
			"plan.model.back": "Back",
			"plan.model.loading": "Loading models…",
			"plan.model.empty": "No models available",
			"plan.model.partialFailure": "{count} provider catalogs could not be loaded",
			"plan.model.retry": "Retry",
			"plan.member.prompt": "Role prompt",
			"plan.member.roleFallback": "Role not set",
			"plan.task.subject": "Task subject",
			"plan.task.description": "Task description",
			"plan.task.assignee": "Assignee",
			"plan.task.dependencies": "Dependency task IDs (comma-separated)",
			"plan.task.dependenciesHint": "For example task-1, task-2; cycles are rejected",
			"plan.task.unassigned": "Shared task pool",
			"plan.unsaved": "Unsaved",
			"plan.save": "Save",
			"plan.saving": "Saving…",
			"plan.remove": "Remove",
			"plan.removed": "Task removed",
			"plan.removeConfirm": "Confirm remove",
			"plan.removeWarning": "Removing {task} will recalculate downstream dependencies.",
			"plan.cancel": "Cancel",
			"plan.addTask": "Add task",
			"plan.adding": "Adding…",
			"plan.taskAdded": "Task added",
			"plan.newTask": "New task subject",
			"plan.newTaskLabel": "Add a planned task",
			"plan.readySummary": "{members} members · {tasks} tasks · {links} dependencies",
			"plan.flow.aria": "Team launch flow",
			"plan.flow.review": "Review plan",
			"plan.flow.spawn": "Create members",
			"plan.flow.run": "Start work",
			"plan.members.title": "Members & model routes",
			"plan.members.count": "{count} members",
			"plan.members.empty": "No members planned yet",
			"plan.tasks.title": "Tasks & dependencies",
			"plan.tasks.count": "{count} tasks · {links} dependencies",
			"plan.tasks.empty": "No tasks planned yet",
			"plan.dependencies.none": "No dependencies",
			"plan.dependencies.count": "{count} dependencies",
			"plan.approve": "Approve & Run",
			"plan.approving": "Creating members…",
			"plan.approveTitle": "Plan ready?",
			"plan.approveHint": "Approval creates {members} members and schedules {tasks} tasks.",
			"plan.approveConfirmTitle": "Confirm team launch",
			"plan.approveWarning": "Member routes and dependencies cannot be edited here after launch.",
			"plan.approveConfirm": "Confirm launch",
			"plan.continue": "Return to chat & revise",
			"plan.returnToChat": "Return to chat",
			"plan.feedbackTitle": "Waiting for your revision direction",
			"plan.feedbackHint": "The Captain will ask in chat. After your reply, it will revise this draft and wait for approval again.",
			"plan.discard": "Discard this plan",
			"plan.discardConfirmTitle": "Discard this plan?",
			"plan.discardWarning": "The plan will end and be archived. No members have been spawned and no tasks will run.",
			"plan.discardConfirm": "Discard plan",
			"plan.discarding": "Discarding…",
			"plan.pendingEdits": "Save the current edits before launching the team.",
			"plan.saved": "Plan saved",
			"plan.failed": "Operation failed: {message}",
			"team.stats.members": "{count} members",
			"team.stats.completed": "{completed}/{total} completed",
			"team.stats.messages": "{count} messages",
			"delegation.aria": "Captain delegation map",
			"captain.name": "Captain",
			"captain.role": "Break down · Delegate · Synthesize",
			"captain.summary": "Assigned {tasks} tasks to {members} members",
			"captain.summary.staged": "Planned {tasks} tasks and {members} members; awaiting approval",
			"captain.summary.awaitingFeedback": "Draft preserved; waiting for your revision direction in chat",
			"captain.summary.discarded": "Plan discarded: {members} members were not created and {tasks} tasks did not run",
			"captain.summary.withTakeover": "Assigned {tasks} to members · Captain owns {captainTasks}",
			"captain.state.working": "{count} active",
			"captain.state.takeover": "Working on {tasks}",
			"captain.state.collected": "All reports received",
			"captain.state.waiting": "Waiting for reports",
			"captain.state.staged": "Awaiting approval",
			"captain.state.awaitingFeedback": "Awaiting feedback",
			"captain.state.discarded": "Discarded",
			"captain.state.settled": "Settled",
			"members.toggle": "Members {count}",
			"members.collapse": "Collapse",
			"members.expand": "Expand",
			"members.expandFinished": "Show finished ({count})",
			"members.empty": "No members yet; waiting for the captain to assemble the team",
			"assignment.label": "Captain assigned",
			"assignment.staged": "Planned task",
			"assignment.discarded": "Plan not run",
			"assignment.empty": "No tasks",
			"archive.label": "Ended · Archived history",
			"archive.discardedLabel": "Plan discarded · Archived history"
		};
		//#endregion
		//#region lib/client/index.js
		/** Required services: conversation nodes, slots, sessions navigation, and locale. */
		const inject = [
			"uiConversation",
			"slots",
			"sessions",
			"locale",
			"modelDirectories",
			"layout"
		];
		const useLegacyPanelInfo = (select) => select({ activePanelId: null });
		/** The replayed user message is the canonical transcript entry. */
		function HiddenAgentTeamsCommand() {
			return null;
		}
		/**
		* Register the activity monitor in the shell's additive overlay and the
		* in-conversation team card. The card's activity button re-opens a folded
		* monitor via a window event — the recovery path for an old session.
		*/
		function apply(ctx) {
			const bridge = createWorkspaceBridge();
			const state = createWorkspaceState();
			ctx.effect(() => ctx.locale.register(AGENT_TEAMS_LOCALE_NAMESPACE, {
				zh,
				en
			}), "agent-teams: dictionaries");
			const openMember = async (parentId, childId) => {
				await openAgentTeamMember(ctx.sessions, parentId, childId, ctx.layout, ctx.get("uiWorkspace")).catch((error) => {
					console.warn(`agent-teams: failed to open member transcript ${childId}: ${String(error)}`);
					throw error;
				});
			};
			const Panel = ({ t, usePanelInfo }) => {
				const conversationVisible = (usePanelInfo ?? useLegacyPanelInfo)((panel) => panel.activePanelId === null);
				return (0, react_jsx_runtime.jsx)(ActivitySurface, {
					bridge,
					state,
					conversationVisible,
					sessionsList: ctx.sessions.list,
					modelDirectories: ctx.modelDirectories,
					openMember,
					t
				});
			};
			ctx.inject(["sidebarRight", "sidebarRightTabs"], (native) => {
				const t = native.locale.bind(AGENT_TEAMS_LOCALE_NAMESPACE);
				native.effect(() => native.sidebarRightTabs.register({
					id: TEAM_TAB_ID,
					kind: TEAM_TAB_KIND,
					title: () => t("workspace.title")
				}));
				native.slots.inject("conversation.session.header.actions", () => native.slots.register({
					name: "conversation.session.header.actions",
					id: "agent-teams-entry",
					order: 50,
					locale: AGENT_TEAMS_LOCALE_NAMESPACE,
					inject: () => ({
						openMember,
						openContext: () => native.sidebarRight.openTab(TEAM_TAB_KIND)
					})
				}, TeamChatEntry));
				native.slots.inject("conversation.chat.turnTail", () => native.slots.register({
					name: "conversation.chat.turnTail",
					id: "agent-teams-summary",
					order: 50,
					locale: AGENT_TEAMS_LOCALE_NAMESPACE,
					inject: () => ({ openMember })
				}, TeamTurnCard));
				native.slots.inject("sidebar.right.pane.tab", () => {
					const dispose = native.slots.register({
						name: "sidebar.right.pane.tab",
						key: TEAM_TAB_ID,
						locale: AGENT_TEAMS_LOCALE_NAMESPACE,
						inject: () => ({
							state,
							modelDirectories: native.modelDirectories,
							openMember,
							openContext: () => native.sidebarRight.openTab(TEAM_TAB_KIND)
						})
					}, WorkspaceActivity);
					bridge.set(native.sidebarRight);
					return () => {
						bridge.set(void 0);
						dispose();
					};
				});
			});
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "agent-teams-activity",
				order: 80,
				label: "TeamFlow activity",
				locale: AGENT_TEAMS_LOCALE_NAMESPACE
			}, Panel));
			for (const command of ["teamflow", "agent-teams"]) ctx.slots.inject("conversation.chat.commandview", () => ctx.slots.register({
				name: "conversation.chat.commandview",
				key: command
			}, HiddenAgentTeamsCommand));
			ctx.uiConversation.events.register(agentTeamsCardDefinition);
			ctx.slots.inject("conversation.chat.node", () => ctx.slots.register({
				name: "conversation.chat.node",
				key: "agent-teams",
				locale: AGENT_TEAMS_LOCALE_NAMESPACE,
				inject: () => ({
					openMember,
					workspaceBridge: bridge
				})
			}, AgentTeamsCard));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map