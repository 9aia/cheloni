import{_ as s,o as a,c as n,ai as e}from"./chunks/framework.Bm4BMKaq.js";const k=JSON.parse('{"title":"Creating a CLI","description":"","frontmatter":{},"headers":[],"relativePath":"guides/essentials/creating-a-cli.md","filePath":"guides/essentials/creating-a-cli.md"}'),t={name:"guides/essentials/creating-a-cli.md"};function l(r,i,h,p,o,d){return a(),n("div",null,[...i[0]||(i[0]=[e(`<h1 id="creating-a-cli" tabindex="-1">Creating a CLI <a class="header-anchor" href="#creating-a-cli" aria-label="Permalink to “Creating a CLI”">​</a></h1><h2 id="best-practices" tabindex="-1">Best Practices <a class="header-anchor" href="#best-practices" aria-label="Permalink to “Best Practices”">​</a></h2><h3 id="file-structure" tabindex="-1">File Structure <a class="header-anchor" href="#file-structure" aria-label="Permalink to “File Structure”">​</a></h3><p><strong>Do</strong>: Organize commands in separate files and import them into a single <code>manifest.ts</code>.</p><pre><code>For bigger projects, we suggest organizing commands in separate files and import them into a single \`manifest.ts\`.

\`\`\`typescript
import { createCli, defineCommand, executeCli } from &#39;cheloni&#39;;

// commands/manifest.ts
import command1 from &#39;./command1&#39;;
import command2 from &#39;./command2&#39;;

const rootCommand = defineCommand({
name: &#39;root&#39;,
commands: [command1, command2],
});

const cli = await createCli({
name: &#39;my-cli&#39;,
command: rootCommand,
});

await executeCli({ cli });
\`\`\`

&gt; **Note**: Lazy loading for commands and plugins is a planned feature but not yet implemented. For now, import commands directly.
</code></pre><p><strong>Don&#39;t</strong>: Import commands directly into the CLI file.</p><p><strong>Why</strong>:</p><h2 id="error-handling" tabindex="-1">Error Handling <a class="header-anchor" href="#error-handling" aria-label="Permalink to “Error Handling”">​</a></h2><p>Wrap <code>createCli</code> and <code>executeCli</code> in try-catch to handle panic situations:</p><div class="language-typescript"><button title="Copy Code" class="copy"></button><span class="lang">typescript</span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">try</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  const</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> cli</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> await</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> createCli</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">({</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    name: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;my-cli&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    command: rootCommand,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  });</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  </span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  await</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> executeCli</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">({ cli });</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">} </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">catch</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (error) {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  if</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (error </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">instanceof</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> Error</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    console.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">error</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;Panic: &quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, error.message);</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    process.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">exit</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">);</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  }</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  throw</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> error;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p><strong>Key points:</strong></p><ul><li><code>createCli</code> can throw if command definitions are invalid</li><li><code>executeCli</code> automatically handles command execution errors</li><li>Handle initialization errors explicitly if needed</li><li>Command handler errors are automatically displayed by the framework</li></ul>`,12)])])}const E=s(t,[["render",l]]);export{k as __pageData,E as default};
