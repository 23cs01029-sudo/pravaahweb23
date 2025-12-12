const scriptURL = "https://script.google.com/macros/s/AKfycby4F5rBxS_-KLmP05Yqm-R7PmjIx9_7dMsa28D1xds3X2jWSMKini-AJ-1wgGR6EmvDlg/exec";

const EVENTS = {
  day0: [],
  day1: ["Event 1","Event 2","Event 3"],
  day2: ["Event 1","Event 2","Event 3"],
  day3: ["Event 1","Event 2","Event 3","Star Nite"]
};

const PRICES = {
  dayPass: { day0:300, day1:800, day2:800, day3_normal:800, day3_star:1100 },
  visitor: { day0:400, day1:500, day2:500, day3_normal:500, day3_star:800 },
  fest: { normal:2000, star:2500 },
  starnite: 300
};

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

let auth = window.auth;
if (!auth) {
  const firebaseConfig = {
    apiKey:"AIzaSyCbXKleOw4F46gFDXz2Wynl3YzPuHsVwh8",
    authDomain:"pravaah-55b1d.firebaseapp.com",
    projectId:"pravaah-55b1d",
    storageBucket:"pravaah-55b1d.appspot.com",
    messagingSenderId:"287687647267",
    appId:"1:287687647267:web:7aecd603ee202779b89196"
  };
  const app = getApps().length?getApps()[0]:initializeApp(firebaseConfig);
  auth = getAuth(app);
  window.auth = auth;
}

const passCards=document.querySelectorAll(".pass-card");
const selectionArea=document.getElementById("selectionArea");
const selectedPassTxt=document.getElementById("selectedPass");
const participantForm=document.getElementById("participantForm");
const numInput=document.getElementById("numParticipants");
const decBtn=document.getElementById("decPart");
const incBtn=document.getElementById("incPart");
const totalAmountEl=document.getElementById("totalAmount");
const payBtn=document.getElementById("payBtn");

let currentPassType=null;
let currentDay=null;
let currentVisitorDays=[];
let includeStarNite=false;
let participantsCount=0;
let cachedProfile={};
let currentTotal=0;
let paying=false;

const emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const phoneRe=/^[0-9+\-\s]{7,15}$/;
const RULEBOOK_URL="rulebooks/sample.pdf";

function getCachedProfile(){ try{return JSON.parse(localStorage.getItem("profileData")||"{}");}catch{return{};} }
function saveProfileCache(obj){ try{localStorage.setItem("profileData",JSON.stringify(obj||{}));}catch{} }

async function refreshProfileFromSheets(email){
  if(!email)return;
  try{
    const r=await fetch(`${scriptURL}?email=${encodeURIComponent(email)}&type=profile`);
    const d=await r.json();
    if(d&&d.email){
      saveProfileCache({name:d.name||"",email:d.email||email,phone:d.phone||"",college:d.college||""});
      cachedProfile=getCachedProfile();
    }
  }catch{}
}

if(auth&&auth.onAuthStateChanged){
  auth.onAuthStateChanged(u=>{
    cachedProfile=getCachedProfile();
    if((!cachedProfile||!cachedProfile.email)&&u?.email){
      saveProfileCache({email:u.email});
      cachedProfile=getCachedProfile();
    }
    if(u?.email)refreshProfileFromSheets(u.email);
  });
}

function escapeHtml(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

function renderEventRow(name,opt={}){
  const day=opt.dayKey||"";
  const selectable=!!opt.selectable;
  const safe=name.replace(/\s+/g,"_");
  const id=`${opt.idPrefix||"ev"}_${safe}`;
  if(selectable){
    return `
    <div class="event-row" data-day="${day}">
      <div class="event-left">
        <input type="checkbox" id="${id}" class="event-checkbox" data-day="${day}" value="${escapeHtml(name)}">
        <label for="${id}" class="event-label">${escapeHtml(name)}</label>
      </div>
      <a href="${RULEBOOK_URL}" target="_blank"><i class="fa-regular fa-file-pdf pdf-icon"></i></a>
    </div>`;
  }
  return `
  <div class="event-row" data-day="${day}">
    <div class="event-left"><span class="event-label">${escapeHtml(name)}</span></div>
    <a href="${RULEBOOK_URL}" target="_blank"><i class="fa-regular fa-file-pdf pdf-icon"></i></a>
  </div>`;
}

passCards.forEach(c=>{
  c.onclick=()=>{
    passCards.forEach(x=>x.classList.remove("selected"));
    c.classList.add("selected");
    let t=c.dataset.type||c.textContent.trim();
    if(/day/i.test(t))t="Day Pass";
    else if(/visitor/i.test(t))t="Visitor Pass";
    else if(/fest/i.test(t))t="Fest Pass";
    else if(/star/i.test(t))t="Starnite Pass";
    currentPassType=t;
    currentDay=null;
    currentVisitorDays=[];
    includeStarNite=false;
    participantsCount=0;
    numInput.value=0;
    renderSelectionArea();
  };
});

function renderSelectionArea(){
  selectionArea.classList.remove("hidden");
  selectedPassTxt.textContent=`Selected: ${currentPassType}`;
  participantForm.innerHTML="";

  if(currentPassType==="Day Pass"){
    participantForm.innerHTML=`
    <div class="participant-card center-box">
      <h4>Choose Day</h4>
      <div class="day-selector-row">
        ${["day0","day1","day2","day3"].map(d=>`
          <button class="day-card" data-day="${d}">${d.toUpperCase()}</button>
        `).join("")}
      </div>
    </div>
    <div id="dayEventsContainer"></div>
    <div id="participantsContainerPlaceholder"></div>`;
    document.querySelectorAll(".day-card").forEach(btn=>{
      btn.onclick=()=>{
        document.querySelectorAll(".day-card").forEach(x=>x.classList.remove("active"));
        btn.classList.add("active");
        currentDay=btn.dataset.day;
        includeStarNite=false;
        renderDayEvents(currentDay);
        calculateTotal();
      };
    });
  }

  if(currentPassType==="Visitor Pass"){
    participantForm.innerHTML=`
    <div class="participant-card center-box">
      <h4>Choose Days to Visit</h4>
      <div class="visitor-days-row">
        ${["day0","day1","day2","day3"].map(d=>`
          <label class="visitor-day-card">
            <input type="checkbox" class="visitorDayCheckbox" value="${d}">
            <span>${d.toUpperCase()}</span>
          </label>
        `).join("")}
      </div>
    </div>
    <div id="visitorEventsContainer"></div>
    <div id="participantsContainerPlaceholder"></div>`;
    document.querySelectorAll(".visitorDayCheckbox").forEach(cb=>{
      cb.onchange=()=>{
        currentVisitorDays=[...document.querySelectorAll(".visitorDayCheckbox:checked")].map(x=>x.value);
        includeStarNite=false;
        renderVisitorEvents(currentVisitorDays);
        calculateTotal();
      };
    });
  }

  if(currentPassType==="Fest Pass"){
    participantForm.innerHTML=`
    <div class="participant-card center-box"><h4>Fest Pass — All Days</h4></div>
    <div id="festEventsContainer"></div>
    <div id="participantsContainerPlaceholder"></div>`;
    renderFestEvents();
  }

  if(currentPassType==="Starnite Pass"){
    participantForm.innerHTML=`
    <div class="participant-card center-box">
      <h4>Starnite Pass</h4>
      <p>Access to Starnite (Day 3)</p>
    </div>
    <div id="participantsContainerPlaceholder"></div>`;
  }

  calculateTotal();
}

function renderDayEvents(day){
  const box=document.getElementById("dayEventsContainer");
  if(!day){box.innerHTML="";return;}
  const ev=EVENTS[day]||[];
  box.innerHTML=`
  <div class="participant-card center-box">
    <h4>${day.toUpperCase()} Events</h4>
    <div class="events-list">
      ${ev.filter(x=>x!=="Star Nite").map(x=>renderEventRow(x,{dayKey:day,selectable:true,idPrefix:`day_${day}`})).join("")}
    </div>
    ${day==="day3"?
      `<div class="starnite-toggle-row">
        <label><input type="checkbox" id="day3StarToggle"><span>Include Star Nite</span></label>
      </div>`:""}
  </div>`;
  const tg=document.getElementById("day3StarToggle");
  if(tg)tg.onchange=e=>{includeStarNite=e.target.checked;calculateTotal();}
}

function renderVisitorEvents(days){
  const box=document.getElementById("visitorEventsContainer");
  if(!days.length){box.innerHTML="";return;}
  box.innerHTML=days.map(d=>{
    const ev=EVENTS[d]||[];
    return `
    <div class="participant-card center-box">
      <h4>${d.toUpperCase()} Events</h4>
      ${ev.map(x=>renderEventRow(x,{dayKey:d,selectable:false})).join("")}
    </div>`;
  }).join("");
}

function renderFestEvents(){
  const box=document.getElementById("festEventsContainer");
  box.innerHTML=["day0","day1","day2","day3"].map(d=>{
    const ev=EVENTS[d]||[];
    return `
    <div class="participant-card center-box">
      <h4>${d.toUpperCase()}</h4>
      <div class="events-list">
        ${ev.filter(x=>x!=="Star Nite").map(x=>renderEventRow(x,{dayKey:d,selectable:true,idPrefix:`fest_${d}`})).join("")}
      </div>
      ${d==="day3"?
      `<div class="starnite-toggle-row">
        <label><input type="checkbox" id="fest_day3_starnite"><span>Include Star Nite</span></label>
      </div>`:""}
    </div>`;
  }).join("");
  setTimeout(()=>{
    const tg=document.getElementById("fest_day3_starnite");
    if(tg)tg.onchange=e=>{includeStarNite=e.target.checked;calculateTotal();}
  },50);
}

function buildParticipantForms(n){
  const box=document.getElementById("participantsContainerPlaceholder");
  participantsCount=n;
  box.innerHTML="";
  if(n<=0){calculateTotal();return;}
  const cache=getCachedProfile();
  for(let i=1;i<=n;i++){
    const div=document.createElement("div");
    div.className="participant-card center-box";
    div.innerHTML=`
      <h4>Participant ${i}</h4>
      <input class="pname" placeholder="Full name" value="${i===1?(cache.name||""):""}">
      <input class="pemail" placeholder="Email" value="${i===1?(cache.email||""):""}">
      <input class="pphone" placeholder="Phone" value="${i===1?(cache.phone||""):""}">
      <input class="pcollege" placeholder="College" value="${i===1?(cache.college||""):""}">`;
    box.appendChild(div);
  }
  calculateTotal();
}

incBtn.onclick=()=>{let v=parseInt(numInput.value)||0;if(v<10){numInput.value=++v;buildParticipantForms(v);}};
decBtn.onclick=()=>{let v=parseInt(numInput.value)||0;if(v>0){numInput.value=--v;buildParticipantForms(v);}};

numInput.oninput=()=>{
  let v=parseInt(numInput.value)||0;
  if(v<0)v=0;if(v>10)v=10;
  numInput.value=v;
  buildParticipantForms(v);
};

function calculateTotal(){
  let t=0;
  if(currentPassType==="Day Pass"){
    if(!currentDay){updateTotal(0);return;}
    t=currentDay!=="day3"?PRICES.dayPass[currentDay]:(includeStarNite?PRICES.dayPass.day3_star:PRICES.dayPass.day3_normal);
  }
  else if(currentPassType==="Visitor Pass"){
    currentVisitorDays.forEach(d=>{
      t+=d!=="day3"?PRICES.visitor[d]:(includeStarNite?PRICES.visitor.day3_star:PRICES.visitor.day3_normal);
    });
  }
  else if(currentPassType==="Fest Pass"){
    t=includeStarNite?PRICES.fest.star:PRICES.fest.normal;
  }
  else if(currentPassType==="Starnite Pass"){
    t=PRICES.starnite;
  }
  updateTotal(t);
}

function updateTotal(t){
  currentTotal=t;
  totalAmountEl.textContent=`Total: ₹${t}`;
  payBtn.style.display=(t>0&&participantsCount>0)?"inline-block":"none";
}

function collectSelectedEvents(){
  const out={day0:[],day1:[],day2:[],day3:[]};
  document.querySelectorAll(".event-checkbox:checked").forEach(c=>{
    out[c.dataset.day].push(c.value);
  });
  return out;
}

payBtn.onclick=async e=>{
  e.preventDefault();
  if(paying)return;
  paying=true;

  const names=[...document.querySelectorAll(".pname")].map(x=>x.value.trim());
  const emails=[...document.querySelectorAll(".pemail")].map(x=>x.value.trim());
  const phones=[...document.querySelectorAll(".pphone")].map(x=>x.value.trim());
  const colleges=[...document.querySelectorAll(".pcollege")].map(x=>x.value.trim());

  for(let i=0;i<names.length;i++){
    if(!names[i]||!emails[i]||!phones[i]||!colleges[i]){alert("Fill all participant fields");paying=false;return;}
    if(!emailRe.test(emails[i])){alert("Invalid email");paying=false;return;}
    if(!phoneRe.test(phones[i])){alert("Invalid phone");paying=false;return;}
  }

  const participants=names.map((n,i)=>({name:n,email:emails[i],phone:phones[i],college:colleges[i]}));
  const selectedEvents=collectSelectedEvents();

  const meta={
    passType:currentPassType,
    totalAmount:currentTotal,
    participantsCount:participants.length,
    selectedDay:currentPassType==="Day Pass"?currentDay:null,
    visitorDays:currentPassType==="Visitor Pass"?currentVisitorDays:null,
    includeStarNite,
    selectedEvents
  };

  const userEmail=auth.currentUser?.email||participants[0].email;

  const options={
    key:"rzp_test_Re1mOkmIGroT2c",
    amount:currentTotal*100,
    currency:"INR",
    name:"PRAVAAH 2026",
    description:`${currentPassType} Registration`,
    handler:async r=>{
      const payload={
        registeredEmail:userEmail,
        paymentId:r.razorpay_payment_id,
        ...meta,
        participants
      };

      let sent=false;
      try{
        if(navigator.sendBeacon)
          sent=navigator.sendBeacon(scriptURL,new Blob([JSON.stringify(payload)],{type:"application/json"}));
      }catch{}

      if(!sent){
        try{await fetch(scriptURL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),keepalive:true});}catch{}
      }

      saveProfileCache(participants[0]);

      document.getElementById("participantsContainerPlaceholder").innerHTML="";
      numInput.value=0;participantsCount=0;
      currentTotal=0;totalAmountEl.textContent="Total: ₹0";payBtn.style.display="none";

      passCards.forEach(x=>x.classList.remove("selected"));
      selectionArea.classList.add("hidden");
      currentPassType=null;currentVisitorDays=[];currentDay=null;includeStarNite=false;

      window.location.href="payment_success.html";
    }
  };

  try{new Razorpay(options).open();}catch{alert("Payment failed");paying=false;}
};

setTimeout(()=>{cachedProfile=getCachedProfile();calculateTotal();},120);

window.PRAVAAH_passModule={EVENTS,PRICES};
