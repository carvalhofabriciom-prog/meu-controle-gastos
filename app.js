const PASS_HASH="cf30953fb0c5444cb3ee6010f42d85618e0850dc69b4d76884db5a912df12d1d";
const DEFAULT_CATS=["Alimentação","Casa","Carro","Lazer","Saúde","Compras","Contas","Outros"];
let expenses=JSON.parse(localStorage.getItem("gastos_expenses")||"[]");
let categories=JSON.parse(localStorage.getItem("gastos_categories")||"null")||DEFAULT_CATS.map((name,i)=>({id:String(i+1),name}));
let fixedExpenses=JSON.parse(localStorage.getItem("gastos_fixed")||"[]");
let deferredInstallPrompt=null;

const $=id=>document.getElementById(id);
const money=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0);
const today=()=>new Date().toISOString().slice(0,10);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
function saveAll(){localStorage.setItem("gastos_expenses",JSON.stringify(expenses));localStorage.setItem("gastos_categories",JSON.stringify(categories));localStorage.setItem("gastos_fixed",JSON.stringify(fixedExpenses));}
function toast(msg){const x=$("toast");x.textContent=msg;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2400)}
async function hash(s){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function unlock(e){e.preventDefault();const p=$("password").value;if(await hash(p)!==PASS_HASH){$("lockMsg").textContent="Senha incorreta.";$("password").value="";return}sessionStorage.setItem("gastos_unlocked","1");showApp()}
function showApp(){$("lock").classList.add("hidden");$("app").classList.remove("hidden");render();}
function lock(){sessionStorage.removeItem("gastos_unlocked");$("app").classList.add("hidden");$("lock").classList.remove("hidden");$("password").value="";$("lockMsg").textContent="";setTimeout(()=>$("password").focus(),100)}
function populateCats(){const old=$("category").value;const rc=$("reportCategory").value;$("category").innerHTML=categories.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join("");$("reportCategory").innerHTML='<option value="">Todas</option>'+categories.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join("");if(categories.some(c=>c.name===old))$("category").value=old;if(categories.some(c=>c.name===rc))$("reportCategory").value=rc}
function range(){const f=$("fromDate").value||"0000-01-01",t=$("toDate").value||"9999-12-31",c=$("reportCategory").value;return expenses.filter(x=>x.date>=f&&x.date<=t&&(!c||x.category===c))}
function render(){populateCats();renderReport();renderSummary();renderFixed();renderCategories()}
function renderReport(){const rows=range(),total=rows.reduce((s,x)=>s+Number(x.amount),0);$("statTotal").textContent=money(total);$("statCount").textContent=rows.length;$("statAvg").textContent=money(rows.length?total/rows.length:0);$("emptyState").classList.toggle("hidden",rows.length>0);$("expenseRows").innerHTML=rows.map(x=>`<tr><td>${x.date.split("-").reverse().join("/")}</td><td>${esc(x.description)}</td><td>${esc(x.category)}</td><td>${esc(x.payment)}</td><td class="amount-cell">${money(x.amount)}</td><td><div class="row-actions"><button onclick="editExpense('${x.id}')">✏️</button><button onclick="deleteExpense('${x.id}')">🗑️</button></div></td></tr>`).join("")}
function renderSummary(){const rows=range(),total=rows.reduce((s,x)=>s+Number(x.amount),0),s={};rows.forEach(x=>s[x.category]=(s[x.category]||0)+Number(x.amount));const entries=Object.entries(s).sort((a,b)=>b[1]-a[1]);$("categorySummary").innerHTML=entries.length?entries.map(([n,v])=>`<div><div class="summary-row"><span>${esc(n)}</span><strong>${money(v)}</strong></div><div class="summary-bar"><div class="summary-fill" style="width:${total?v/total*100:0}%"></div></div></div>`).join(""):'<div class="muted small">Sem gastos no período.</div>'}
function renderFixed(){$("fixedList").innerHTML=fixedExpenses.length?fixedExpenses.map(x=>`<div class="fixed-item"><div><strong>${esc(x.name)}</strong><div class="muted small">${money(x.amount)}/mês</div></div><button class="icon-btn" onclick="deleteFixed('${x.id}')">🗑️</button></div>`).join(""):'<div class="muted small">Nenhuma conta fixa cadastrada.</div>'}
function renderCategories(){$("categoryList").innerHTML=categories.map(c=>`<div class="chip">${esc(c.name)} <button onclick="deleteCategory('${c.id}','${esc(c.name)}')">×</button></div>`).join("")}
$("unlockForm").onsubmit=unlock;$("lockBtn").onclick=lock;
$("date").value=today();const d=new Date(),ms=new Date(d.getFullYear(),d.getMonth(),1).toISOString().slice(0,10);$("fromDate").value=ms;$("toDate").value=today();
$("expenseForm").onsubmit=e=>{e.preventDefault();const id=$("expenseId").value;const x={id:id||uid(),amount:Number($("amount").value),description:$("description").value.trim(),category:$("category").value,payment:$("payment").value,date:$("date").value,note:$("note").value.trim()};if(id)expenses=expenses.map(a=>a.id===id?x:a);else expenses.push(x);saveAll();resetExpense();render();toast(id?"Gasto atualizado!":"Gasto adicionado!")};
function resetExpense(){$("expenseId").value="";$("amount").value="";$("description").value="";$("note").value="";$("date").value=today();$("cancelEdit").classList.add("hidden");$("saveText").textContent="Adicionar gasto"}
$("cancelEdit").onclick=resetExpense;
window.editExpense=id=>{const x=expenses.find(a=>a.id===id);if(!x)return;$("expenseId").value=x.id;$("amount").value=x.amount;$("description").value=x.description;$("category").value=x.category;$("payment").value=x.payment;$("date").value=x.date;$("note").value=x.note||"";$("cancelEdit").classList.remove("hidden");$("saveText").textContent="Salvar alterações";scrollTo({top:180,behavior:"smooth"})};
window.deleteExpense=id=>{if(!confirm("Excluir este gasto?"))return;expenses=expenses.filter(x=>x.id!==id);saveAll();render();toast("Gasto excluído.")};
$("reportBtn").onclick=()=>{renderReport();renderSummary()};$("fromDate").onchange=()=>{renderReport();renderSummary()};$("toDate").onchange=()=>{renderReport();renderSummary()};$("reportCategory").onchange=()=>{renderReport();renderSummary()};$("printBtn").onclick=()=>print();
$("addCategoryBtn").onclick=()=>{$("newCategoryName").value="";$("categoryDialog").showModal()};$("categoryForm").onsubmit=e=>{e.preventDefault();const n=$("newCategoryName").value.trim();if(!n)return;if(categories.some(c=>c.name.toLowerCase()===n.toLowerCase())){toast("Essa categoria já existe.");return}categories.push({id:uid(),name:n});saveAll();$("categoryDialog").close();render();toast("Categoria criada.")};
window.deleteCategory=(id,n)=>{if(expenses.some(x=>x.category===n)){alert("Essa categoria possui gastos. Altere-os antes de excluir.");return}if(confirm(`Excluir "${n}"?`)){categories=categories.filter(c=>c.id!==id);saveAll();render();toast("Categoria excluída.")}};
$("addFixedBtn").onclick=()=>{$("fixedName").value="";$("fixedAmount").value="";$("fixedDialog").showModal()};$("fixedForm").onsubmit=e=>{e.preventDefault();fixedExpenses.push({id:uid(),name:$("fixedName").value.trim(),amount:Number($("fixedAmount").value)});saveAll();$("fixedDialog").close();render();toast("Conta fixa adicionada.")};
window.deleteFixed=id=>{if(confirm("Excluir esta conta fixa?")){fixedExpenses=fixedExpenses.filter(x=>x.id!==id);saveAll();render();toast("Conta fixa excluída.")}};
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;$("installBtn").classList.remove("hidden")});
$("installBtn").onclick=async()=>{if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$("installBtn").classList.add("hidden")}};
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(console.warn));
if(sessionStorage.getItem("gastos_unlocked")==="1")showApp();
