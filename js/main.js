// ==========================================
// 1. SUPABASE KONFIGURACIJA ⚡
// ==========================================
const SUPABASE_URL = 'https://supabase.ajvn.org';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc2MTAxNzk5LCJleHAiOjE5MzM3ODE3OTl9.32MDyo-v4htD55ElEXGXzxUovpAIopRRheOH3BwGQnQ';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// GLOBALNE VARIJABLE
let odabraniTagoviZaOglas = []; 
let aktivniFilteri = []; // Za pretragu
let oglasZaBrisanjeId = null;
let proizvodi = []; 
let trenutnaKategorija = 'sve'; 
let trenutnaStrana = 0;
const BROJ_PO_STRANICI = 20;
// GLOBALNE VARIJABLE
let trenutniLimit = 20; // Koliko oglasa vidimo odjednom
const KORAK_UCITAVANJA = 20; // Koliko se doda kad klikneš dugme
let adminOffset = 0;
const ADMIN_LIMIT = 20;
let adminSearchTerm = "";

// Helper funkcija za relativno vreme
function vremeProteklo(datumISO) {
    if(!datumISO) return "";
    const sad = new Date();
    const proslo = new Date(datumISO);
    const sekunde = Math.floor((sad - proslo) / 1000);

    let interval = sekunde / 31536000;
    if (interval > 1) return Math.floor(interval) + " god.";
    interval = sekunde / 2592000;
    if (interval > 1) return Math.floor(interval) + " mes.";
    interval = sekunde / 86400;
    if (interval > 1) return Math.floor(interval) + " d."; // Skraćeno za dane
    interval = sekunde / 3600;
    if (interval > 1) return Math.floor(interval) + " h";   // Skraćeno za sate
    interval = sekunde / 60;
    if (interval > 1) return Math.floor(interval) + " min"; // Skraćeno za minute
    return "Upravo";
}

// Helper za računanje preostalog vremena
function vremeDoIsteka(datumIstekaISO) {
    if(!datumIstekaISO) return "Trajno"; // Za svaki slučaj

    const sad = new Date();
    const istek = new Date(datumIstekaISO);
    const razlika = istek - sad; // Razlika u milisekundama

    // Ako je prošlo vreme
    if (razlika < 0) return "ISTEKLO";

    // Konverzija
    const dana = Math.floor(razlika / (1000 * 60 * 60 * 24));
    const sati = Math.floor((razlika % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (dana > 0) return `${dana} dana`;
    if (sati > 0) return `${sati} sati`;
    return "Manje od sat vremena";
}

// ==========================================
// 2. UI LOGIKA - KATEGORIJE I TAGOVI (STYLED) 🎨
// ==========================================

const specifikacije = {
    sve: { 
        "Popularno": ["Gaming", "Jeftino", "Novo", "Hitno", "RGB", "High-End", "Workstation", "Mini PC", "Pod garancijom"] 
    },
gpu: {
        "Proizvođač Čipa": ["Nvidia", "AMD", "Intel"],
        "Nvidia RTX Serije": ["RTX 5090", "RTX 5080", "RTX 5070 Ti", "RTX 5070", "RTX 5060 Ti", "RTX 5060","RTX 4090", "RTX 4080", "RTX 4070 Ti", "RTX 4070", "RTX 4060 Ti", "RTX 4060", "RTX 3090 Ti", "RTX 3090", "RTX 3080 Ti", "RTX 3080", "RTX 3070 Ti", "RTX 3070", "RTX 3060 Ti", "RTX 3060", "RTX 3050", "RTX 2080 Ti", "RTX 2080 Super", "RTX 2080", "RTX 2070 Super", "RTX 2070", "RTX 2060 Super", "RTX 2060"],
        "Nvidia GTX Serije": ["GTX 1660 Ti", "GTX 1660 Super", "GTX 1660", "GTX 1650 Super", "GTX 1650", "GTX 1080 Ti", "GTX 1080", "GTX 1070 Ti", "GTX 1070", "GTX 1060 6GB", "GTX 1060 3GB", "GTX 1050 Ti", "GTX 1050", "GTX 980 Ti", "GTX 970"],
        "AMD Radeon Serije": ["RX 9070 XT", "RX 9070", "RX 9060 XT 16GB", "RX 9060 XT 8GB","RX 7900 XTX", "RX 7900 XT", "RX 7800 XT", "RX 7700 XT", "RX 7600", "RX 6950 XT", "RX 6900 XT", "RX 6800 XT", "RX 6800", "RX 6750 XT", "RX 6700 XT", "RX 6700", "RX 6650 XT", "RX 6600 XT", "RX 6600", "RX 5700 XT", "RX 5700", "RX 5600 XT", "RX 5500 XT", "RX 590", "RX 580", "RX 570", "RX 480", "RX 470"],
        "VRAM Memorija": ["32GB","24GB", "20GB", "16GB", "12GB", "10GB", "8GB", "6GB", "4GB", "Manje od 4GB"],
        "Dužina (Fizička)": ["Preko 340mm (Massive)", "300mm - 340mm (Velike)", "250mm - 300mm (Standard)", "Ispod 250mm (ITX)"],
        "Tip Hlađenja": ["3 Ventilatora (Massive)", "2 Ventilatora", "Blower (Turbina)", "Vodeno Hlađenje (AIO)"],
        "Konektori za Napajanje": ["12VHPWR (Novi standard)", "3x 8-pin", "2x 8-pin", "1x 8-pin", "Ne treba napajanje"],
        "Stanje": ["Novo (Neotpakovano)", "Polovno (Kao novo)", "Polovno (Ima tragove)", "Neispravno / Za delove"]
    },
    cpu: {
        "Platforma": ["Intel", "AMD"],
        "Intel Generacije": ["14. Gen", "13. Gen", "12. Gen", "11. Gen", "10. Gen", "9. Gen", "Starije od 9. Gen"],
        "Intel Serija": ["i9 (Entuzijasti)", "i7 (High-End)", "i5 (Mid-Range)", "i3 (Budžet)"],
        "AMD Serija": ["Ryzen 9", "Ryzen 7", "Ryzen 5", "Ryzen 3", "Threadripper"],
        "Socket": ["LGA1700", "LGA1200", "LGA1151", "AM5", "AM4", "TR4"],
        "Dodaci (Važno)": ["Integrisana grafika (Ima)", "F/KF Verzija (Nema grafiku)", "Box Pakovanje (Sa kulerom)", "Tray (Samo procesor)", "K Verzija (Otključan za OC)"]
    },
    maticna: {
        "Format (Veličina)": ["E-ATX (Massive)", "ATX (Standard)", "mATX (Micro)", "Mini-ITX (SFF)"],
        "Socket": ["LGA1700", "LGA1200", "LGA1151", "AM5", "AM4", "AM3+"],
        "Intel Chipset": ["Z790", "Z690", "Z590", "Z490", "B760", "B660", "B560", "H610"],
        "AMD Chipset": ["X670E / X670", "X570", "B650E / B650", "B550", "B450", "A620", "A320"],
        "Memorija Tip": ["DDR5", "DDR4", "DDR3"],
        "Mreža & Povezivanje": ["Ima ugrađen Wi-Fi", "Wi-Fi 6E / 7", "Samo LAN kabel", "Bluetooth"],
        "Entuzijast Detalji": ["BIOS Flashback dugme", "Debug LED ekran", "Ojačani PCIe slotovi", "2 ili više M.2 slota"]
    },
    ram: {
        "Tip": ["DDR5", "DDR4", "DDR3", "Laptop SODIMM"],
        "Kapacitet (Ukupno)": ["128GB", "64GB", "32GB", "16GB", "8GB", "4GB"],
        "Brzina DDR5": ["8000MHz+", "7200MHz", "6400MHz", "6000MHz", "5600MHz", "4800MHz"],
        "Brzina DDR4": ["4000MHz+", "3600MHz", "3200MHz", "3000MHz", "2666MHz", "2400MHz"],
        "Latencija (CAS)": ["CL14 (Top tier)", "CL16", "CL18", "CL30 (DDR5)", "CL36 (DDR5)"],
        "Memorijski Čip (Geek)": ["Samsung B-Die", "SK Hynix", "Micron E-Die"],
        "Izgled": ["RGB Osvetljenje", "Low Profile (Niski)", "Sa Hladnjacima", "Bez Hladnjaka (Goli)"]
    },
    skladiste: {
        "Tip": ["M.2 NVMe", "M.2 SATA", "SSD SATA 2.5\"", "HDD 3.5\"", "HDD 2.5\"", "Eksterni Disk"],
        "Kapacitet": ["8TB+", "4TB", "2TB", "1TB", "512GB", "256GB", "128GB"],
        "Brzina (NVMe)": ["PCIe 5.0 (Iznad 10000 MB/s)", "PCIe 4.0 (Oko 7000 MB/s)", "PCIe 3.0 (Oko 3500 MB/s)"],
        "Zdravlje (Sentinel/TBW)": ["100% / 100% Health", "Preko 90% Health", "Preko 80% Health", "Malo korišćen (Mali TBW)", "Loši sektori"],
        "Arhitektura": ["Ima DRAM Keš (Brži)", "DRAM-less (Jeftiniji)"]
    },
    monitor: {
        "Rezolucija": ["4K UHD (3840x2160)", "2K QHD (2560x1440)", "Full HD 1080p", "Ultrawide (21:9)"],
        "Osvežavanje": ["540Hz", "360Hz", "240Hz", "165Hz / 175Hz", "144Hz", "120Hz", "75Hz", "60Hz"],
        "Panel": ["OLED / QD-OLED", "Fast IPS", "IPS", "VA", "TN", "Mini-LED"],
        "Veličina": ["49\"+", "34\" Ultrawide", "32\"", "27\"", "24\" - 25\"", "Manji od 24\""],
        "Ergonomija & Nosač": ["VESA Kačenje (Za ruku)", "Pivot (Vertikalno okretanje)", "Podesiv po visini", "Samo nagib"],
        "Sync Tehnologija": ["G-Sync Ultimate / Native", "G-Sync Compatible", "FreeSync Premium"]
    },
    periferije: {
        "Tip": ["Tastatura", "Miš", "Slušalice", "Mikrofon", "Podloga", "Kontroler (Gamepad)", "Web Kamera"],
        "Povezivanje": ["Wireless 2.4GHz (Brzo)", "Bluetooth", "Žično (USB)"],
        "Tastature - Format": ["Full Size (100%)", "TKL (80%)", "60% / 65% (Mini)"],
        "Tastature - Prekidači": ["Hot-Swappable (Zamenjivi)", "Linear (Crveni)", "Tactile (Braon)", "Clicky (Plavi)", "Optički", "Membranska"],
        "Tastature - Layout": ["US Raspored", "YU / SRB Raspored", "UK Raspored"],
        "Miš - Težina": ["Ultralight (Ispod 65g)", "Standard (70g - 90g)", "Težak / Sa tegovima"],
        "Slušalice - Tip": ["Preko ušiju (Over-ear)", "Bubice (In-ear)", "Otvorenog tipa (Open-back)", "Sa mikrofonom"],
        "Brend": ["Logitech G", "Razer", "SteelSeries", "HyperX", "Corsair", "Glorious", "Keychron", "Asus ROG", "Dark Project", "Zowie / Vaxee"]
    },
   kuciste: {
        "Veličina": ["Full Tower (Ogromno)", "Mid Tower (Standard)", "Mini-ITX / SFF (Malo)", "Dual Chamber (Kockasto)"],
        "Airflow & Paneli": ["Mesh Napred (Dobar protok)", "Staklo Napred", "Staklo sa strane (Tempered)", "Zvučna izolacija (Tiho)"],
        "Vodeno Hlađenje (Radijatori)": ["Podržava 360mm", "Podržava 280mm", "Podržava 240mm"],
        "Maksimalna GPU Dužina": ["Preko 340mm (Ogromno)", "Do 340mm (Standard ATX)", "Do 300mm (Kompaktno)", "Samo ITX (Ispod 250mm)"],
        "Boja": ["Potpuno Crna", "Potpuno Bela", "Siva / Gunmetal", "Pink / Custom"]
    },
    napajanje: {
        "Snaga": ["1600W+", "1200W", "1000W", "850W", "750W", "650W", "500W - 600W", "Ispod 500W"],
        "Sertifikat (Efikasnost)": ["80+ Titanium", "80+ Platinum", "80+ Gold", "80+ Bronze", "Bez sertifikata"],
        "Modularnost": ["Full Modular (Svi kablovi se skidaju)", "Semi Modular", "Non Modular (Fiksni kablovi)"],
        "Novi Standardi": ["ATX 3.0 (Ima 12VHPWR kabal)", "SFX (Za mala kućišta)", "SFX-L"]
    },
    konfiguracije: {
        "Namena": ["Gaming PC", "Office / Home PC", "Workstation (Render/Video)", "Server", "Mini HTPC"],
        "Procesor (CPU)": ["Intel Core i9 / i7", "Intel Core i5 / i3", "AMD Ryzen 9 / 7", "AMD Ryzen 5 / 3"],
        "Grafička (GPU)": ["RTX 4090 / 4080 (High End)", "RTX 4070 / 3080 (Mid-High)", "RTX 4060 / 3060 (1080p Gaming)", "AMD RX 7000 Serija", "Integrisana grafika"],
        "RAM Memorija": ["64GB+", "32GB", "16GB", "8GB"],
        "Skladište": ["2TB+ NVMe", "1TB NVMe", "500GB SSD", "Ima i dodatni HDD"],
        "Aestetika": ["Puno RGB Osvetljenja", "Stealth (Bez svetla)", "Custom vodeno hlađenje (Cevi)"]
    },
    konzole: {
        "Platforma": ["PlayStation", "Xbox", "Nintendo", "Handheld PC (Steam Deck/Ally)"],
        "Sony PlayStation": ["PS5 Pro", "PS5 Disc", "PS5 Digital", "PS4 Pro / Slim", "PS3 / Starije"],
        "Microsoft Xbox": ["Xbox Series X", "Xbox Series S", "Xbox One", "Xbox 360"],
        "Nintendo": ["Switch OLED", "Switch V2 / V1", "Switch Lite", "Retro (Wii, GameBoy)"],
        "Stanje & Modifikacije": ["Novo (Neotpakovano)", "Polovno (Kao novo)", "Čipovano / Modovano (Ima igre)"],
        "Dodaci u paketu": ["Dolazi sa 2 Džojstika", "Dolazi sa igrama na disku", "Dolazi sa Nalogom", "Volan i pedale", "VR Oprema"]
    },
    ostalo: {
        "Tip": ["Vazdušni Kuler za CPU", "AIO Vodeno Hlađenje", "Custom Loop Delovi (Pumpe/Blokovi)", "Termalna Pasta / Padovi", "Ventilatori za kućište", "Kablovi i Adapteri", "Mrežna Oprema (Ruteri)"]
    }
};

const brendoviBaza = {
    gpu: ["Asus (ROG/TUF)", "MSI (Suprim/Gaming)", "Gigabyte (Aorus/Eagle)", "Zotac", "Sapphire (Nitro/Pulse)", "XFX", "PowerColor (Red Devil)", "EVGA", "Palit", "Gainward", "PNY", "Inno3D"],
    cpu: ["Intel", "AMD"],
    maticna: ["Asus (ROG/Prime)", "MSI", "Gigabyte", "ASRock", "NZXT", "Biostar", "EVGA"],
    ram: ["Kingston (Fury)", "Corsair (Vengeance)", "G.Skill (Trident/Ripjaws)", "TeamGroup (T-Force)", "Patriot (Viper)", "ADATA (XPG)", "Crucial (Ballistix)", "Mushkin"],
    monitor: ["Samsung (Odyssey)", "LG (UltraGear)", "Dell (Alienware)", "AOC", "Alienware", "BenQ (Zowie)", "Asus (ROG/Swift)", "Acer (Predator)", "Gigabyte", "MSI", "HP (Omen)", "Lenovo (Legion)"],
   periferije: ["Logitech G", "Razer", "SteelSeries", "HyperX", "Glorious", "Redragon", "Corsair", "Keychron", "Ducky", "Varmilo", "Zowie", "Finalmouse", "Asus", "Dark Project"],
    kuciste: ["NZXT", "Corsair", "Lian Li", "Fractal Design", "Cooler Master", "Phanteks", "Be Quiet!", "Hyte", "DeepCool", "MS Industrial", "Thermaltake"],
    skladiste: ["Samsung (980/990)", "Kingston", "Western Digital (WD)", "Seagate", "Crucial", "Sabrent", "ADATA", "Silicon Power"],
    napajanje: ["Seasonic", "Corsair", "EVGA", "Be Quiet!", "Cooler Master", "Thermaltake", "Asus (Thor/Loki)", "Super Flower", "FSP", "Chieftec", "Gigabyte"], 
    konzole: ["Sony", "Microsoft", "Nintendo", "Valve", "Asus", "Lenovo", "Logitech", "Sega", "Atari"],
    konfiguracije: ["Custom Build (Sklapan)", "Gigatron / Lokalni Shop", "Asus ROG", "MSI", "HP Omen", "Lenovo Legion", "Dell Alienware", "Acer Predator", "Apple Mac"]
};

// ==========================================
// 3. AUTH & UTILS 🛠️
// ==========================================

window.prikaziAlert = function(naslov, poruka) {
    const box = document.getElementById('custom-alert-box');
    if(box) {
        document.getElementById('alert-title').innerText = naslov;
        
        // 👇 OVDE JE BILA GREŠKA. PROMENI 'innerText' U 'innerHTML'
        document.getElementById('alert-message').innerHTML = poruka; 
        
        box.style.display = 'block';
    } else {
        // Fallback za običan alert (tu moramo da sklonimo tagove ako ih ima)
        alert(naslov + "\n" + poruka.replace(/<[^>]*>?/gm, ''));
    }
};

window.zatvoriAlert = function() {
    document.getElementById('custom-alert-box').style.display = 'none';
};

window.otvoriPremium = function() {
    const modal = document.getElementById('premium-modal');
    if(modal) modal.style.display = 'flex';
};

window.prijaviSeGoogle = async function() { 
    const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname }
    });
    if (error) prikaziAlert("GREŠKA", error.message);
};

window.odjaviSe = async function() {
    await sb.auth.signOut();
    window.location.reload();
};

window.kompresujSliku = function(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if(w > 800) { h *= 800/w; w = 800; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
              // Menjamo format u webp i kvalitet na 0.8 (odličan odnos veličina/kvalitet)
resolve(canvas.toDataURL('image/webp', 0.8));
            };
        };
    });
};

// ==========================================
// 4. UI LOGIKA (Forma & Filteri) 🎨
// ==========================================

// Popunjava formu za postavljanje oglasa
window.ucitajPodatkeZaKategoriju = function(kategorija) {
    const brendSelect = document.getElementById('brend');
    const tagsContainer = document.getElementById('form-tags-container');
    
    if(brendSelect) {
        brendSelect.innerHTML = '<option value="" disabled selected>Izaberi...</option>';
        (brendoviBaza[kategorija] || ["Ostalo"]).forEach(b => {
            brendSelect.innerHTML += `<option value="${b}">${b}</option>`;
        });
    }

    if(tagsContainer) {
        tagsContainer.innerHTML = '';
        odabraniTagoviZaOglas = [];
        const specs = specifikacije[kategorija] || specifikacije['sve'];
        
        for (const [grupa, opcije] of Object.entries(specs)) {
            const groupDiv = document.createElement('div');
            groupDiv.style.width = "100%";
            groupDiv.style.marginBottom = "10px";
            groupDiv.innerHTML = `<div class="spec-group-title">${grupa}</div>`;
            
            const btnContainer = document.createElement('div');
            btnContainer.style.display = "flex"; 
            btnContainer.style.flexWrap = "wrap"; 
            btnContainer.style.gap = "5px";

            opcije.forEach(opt => {
                const btn = document.createElement('button');
                btn.type = "button";
                btn.className = "tag-btn";
                btn.innerText = opt;
                btn.onclick = () => {
                    btn.classList.toggle('active');
                    const val = `${grupa}: ${opt}`;
                    if(btn.classList.contains('active')) odabraniTagoviZaOglas.push(val);
                    else odabraniTagoviZaOglas = odabraniTagoviZaOglas.filter(t => t !== val);
                };
                btnContainer.appendChild(btn);
            });
            groupDiv.appendChild(btnContainer);
            tagsContainer.appendChild(groupDiv);
        }
    }
};

// Sinhronizuje Sidebar Filter na Berzi
// Sinhronizuje Sidebar Filter na Berzi
function azurirajSidebarFiltere(kategorija) {
    const container = document.getElementById('sidebar-tags-container');
    if(!container) return;
    
    container.innerHTML = '';
    aktivniFilteri = []; // Resetujemo filtere kad se menja kategorija
    const specs = specifikacije[kategorija] || specifikacije['sve'];

    for (const [grupa, opcije] of Object.entries(specs)) {
        const groupDiv = document.createElement('div');
        groupDiv.innerHTML = `<h4 style="color:#fff; margin:10px 0 5px; font-size:0.9rem;">${grupa}</h4>`;
        
        const wrap = document.createElement('div');
        wrap.style.display = 'flex'; wrap.style.flexWrap = 'wrap'; wrap.style.gap = '5px';

        opcije.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'tag-btn'; // Koristi isti CSS stil
            btn.innerText = opt;
            
            // --- OVDE JE BILA GREŠKA ---
            btn.onclick = () => {
                btn.classList.toggle('active');
                
                // 1. Ažuriraj listu aktivnih filtera
                if(btn.classList.contains('active')) {
                    aktivniFilteri.push(opt);
                } else {
                    aktivniFilteri = aktivniFilteri.filter(f => f !== opt);
                }
                
                // 2. OBAVEZNO: Osveži prikaz oglasa odmah!
                if(typeof window.osveziPrikaz === 'function') {
                    window.osveziPrikaz();
                }
            };
            // ---------------------------

            wrap.appendChild(btn);
        });
        groupDiv.appendChild(wrap);
        container.appendChild(groupDiv);
    }
}

window.promeniKategoriju = function(kat, btnElement) {
    // 🛑 FIX ZA IZLOG: Ako krene da menja kategoriju, izbacujemo ga iz izloga na globalnu berzu
    if (sessionStorage.getItem('open_seller')) {
        sessionStorage.removeItem('open_seller');
        const izlog = document.getElementById('seller-storefront');
        if(izlog) izlog.style.display = 'none';
    }

    trenutniLimit = 20;
    trenutnaKategorija = kat;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');
    
    const sidebarSelect = document.getElementById('sidebar-cat-select');
    if(sidebarSelect) sidebarSelect.value = kat;
    const catName = document.getElementById('sidebar-category-name');
    if(catName) catName.innerText = kat.toUpperCase();

    azurirajSidebarFiltere(kat); 
    ucitajNajnovijeOglase(); 
}

window.otvoriFiltere = function() {
    document.getElementById('filter-sidebar').classList.add('active');
    document.getElementById('sidebar-overlay').style.display = 'block';
    // Ako sidebar nije popunjen, popuni ga trenutnom kategorijom
    if(document.getElementById('sidebar-tags-container').innerHTML === "") {
        azurirajSidebarFiltere(trenutnaKategorija);
    }
};

window.zatvoriFiltere = function() {
    document.getElementById('filter-sidebar').classList.remove('active');
    document.getElementById('sidebar-overlay').style.display = 'none';
};

// ==========================================
// 5. POSTAVLJANJE OGLASA (LIMITI & CHECK) 📝
// ==========================================
const oglasForm = document.getElementById('oglas-form');

if (oglasForm) {
    oglasForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // 1. OBAVEZNO PRVO OVO - SPREČAVA REFRESH

        const { data: { user } } = await sb.auth.getUser();
        
        // 2. Provera prijave
        if (!user) { 
            prikaziAlert("GREŠKA", "Morate biti prijavljeni!"); 
            return; 
        }

        // --- 3. PROVERA LIMITA (DINAMIČKA) ---
        const { count } = await sb.from('listings').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
        const { data: profile } = await sb.from('profiles').select('ads_limit').eq('id', user.id).single();
        const limit = profile?.ads_limit || 50; // Podigli smo svima besplatan limit na 50

        if (count >= limit) {
            otvoriPremium();
            return;
        }

        const submitBtn = oglasForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerText = "Postavljanje...";

        try {
          
         // --- 4. UPLOAD SLIKA (SA STROGOIM LIMITOM) ---
            const slikeInput = document.getElementById('slike');
            let slikeLinkovi = ["assets/img/neon-logo1.png"];
            
            if (slikeInput.files.length > 0) {
                slikeLinkovi = [];
                
                // ODREĐIVANJE LIMITA
                // Ako je korisnik PRO, limit je veći (npr 10), ako je FREE limit je 3
                // Ovde ćemo za sada staviti tvrdi limit od 3 da rešimo problem odmah
                const limitSlika = 3; 
                
                // Uzimamo samo prvih X fajlova, ostale ignorišemo!
                const brojSlikaZaUpload = Math.min(slikeInput.files.length, limitSlika);

                for (let i = 0; i < brojSlikaZaUpload; i++) {
                    const compressed = await window.kompresujSliku(slikeInput.files[i]);
                    const res = await fetch(compressed);
                    const blob = await res.blob();
                    
                    const name = `${Date.now()}_${Math.random()}.webp`;
                    
                    const { error } = await sb.storage.from('ads-images').upload(name, blob);
                    if(error) throw error;
                    
                    const { data } = sb.storage.from('ads-images').getPublicUrl(name);
                    slikeLinkovi.push(data.publicUrl);
                }
                
                // Ako je pokušao više, obavesti ga (opciono)
                if (slikeInput.files.length > limitSlika) {
                    alert(`Napomena: Otpremili smo samo prve ${limitSlika} slike zbog limita paketa.`);
                }
            }

            // --- 5. ČUVANJE IMENA FIRME ---
            const unetoIme = document.getElementById('ime-prodavca').value;
            const { data: postojeciProfil } = await sb.from('profiles').select('id').eq('id', user.id).single();
            
            if (!postojeciProfil) {
                await sb.from('profiles').insert({ id: user.id, company_name: unetoIme });
            } else {
                await sb.from('profiles').update({ company_name: unetoIme }).eq('id', user.id).is('company_name', null);
            }

            // --- 6. PRIPREMA OPISA (SA TAGOVIMA) ---
            // Ovde uzimamo opis I dodajemo tagove na njega
            let finalniOpis = document.getElementById('opis').value;

            if (odabraniTagoviZaOglas.length > 0) {
                const tagoviString = "\n\n[SPECIFIKACIJE]: " + odabraniTagoviZaOglas.join(', ');
                finalniOpis += tagoviString; 
            }

            // --- 7. SLANJE U BAZU ---
            const { error } = await sb.from('listings').insert({
                title: document.getElementById('naziv').value,
                description: finalniOpis, // <-- Šaljemo modifikovan opis
                price: parseFloat(document.getElementById('cena').value),
                category: document.getElementById('kategorija').value,
                city: document.getElementById('grad').value,
                phone: document.getElementById('telefon').value,
                seller_name: document.getElementById('ime-prodavca').value,
                condition: document.getElementById('stanje').value,
                images: slikeLinkovi,
                user_id: user.id,
                user_email: user.email,
                expires_at: new Date(Date.now() + 30*24*60*60*1000).toISOString()
            });

            if (error) throw error;
            
            prikaziAlert("USPEH", "Oglas uspešno postavljen! ");
            setTimeout(() => window.location.href = "komponente.html", 1500);

        } catch (err) {
            console.error(err); // Da vidiš grešku u konzoli ako je ima
            prikaziAlert("GREŠKA", "Došlo je do greške: " + err.message);
            submitBtn.disabled = false;
            submitBtn.innerText = "POSTAVI OGLAS";
        }
    });
}

// ==========================================
// 6. BERZA & KARTICE (SA FILTERIMA I SORTIRANJEM) 🃏
// ==========================================

window.ucitajNajnovijeOglase = async function() {
    const container = document.getElementById('all-products-container');
    const latestCont = document.getElementById('latest-container');
    
    // 1. SKELETON LOADING
    const skeletonHTML = Array(8).fill(`
        <div class="skeleton-card">
            <div class="skeleton-img"></div>
            <div class="skeleton-info">
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-line price"></div>
                <div class="skeleton-line" style="margin-top:auto;"></div>
            </div>
        </div>
    `).join('');

    if(container) container.innerHTML = skeletonHTML;
    if(latestCont) latestCont.innerHTML = skeletonHTML;

    // 🔥 2. PAMETNI LIMITI - OVO MENJAMO!
    // Ranije je bilo 30. Sada stavljamo 200 (ili 500).
    // To znači da učitavamo "skoro sve" odjednom, jer su slike sada lagane.
    let limitBaza = 200; 
    
    // Ako smo u specifičnoj kategoriji, možemo povući i više jer ih je manje ukupno
    if(trenutnaKategorija !== 'sve') {
        limitBaza = 500; 
    }
// 3. PRIPREMA UPITA
    let danasnjiDatum = new Date().toISOString(); 

    let query = sb.from('listings')
                  .select('*, profiles(is_verified, company_name, premium_do)') // 🔥 DODATO premium_do
                 // .gte('expires_at', danasnjiDatum) 
                  .order('created_at', { ascending: false })
                  .limit(limitBaza); 

    // Filtriranje kategorije na serveru
    if(trenutnaKategorija !== 'sve') {
        query = query.eq('category', trenutnaKategorija);
    }

    // Izvršavanje
    const { data: oglasi, error } = await query;

    if (error || !oglasi) {
        console.error("Greška:", error);
        if(container) container.innerHTML = '<p style="text-align:center; padding:20px; color:#ff4d4d;">Greška pri učitavanju.</p>';
        return;
    }

    // 4. MAPIRANJE SA VREMENSKOM PROVEROM
    proizvodi = oglasi.map(o => {
        // 🔥 NOVO: Proveravamo da li je datum istekao!
        const premiumDo = o.profiles?.premium_do ? new Date(o.profiles.premium_do) : null;
        const jelPremium = premiumDo && premiumDo > new Date(); // true ako je u budućnosti

        return {
            id: o.id,
            naslov: o.title,
            cena: o.price,
            opis: o.description || "",
            slika: o.images?.[0] || 'assets/img/neon-logo1.png',
            images: o.images,
            kategorija: o.category,
            stanje: o.condition,
            prodavacId: o.user_id,
            prodavacIme: o.profiles?.company_name || o.seller_name,
            prodavacEmail: o.user_email,
            telefon: o.phone,
            verifikovan: jelPremium, // 🔥 OVO GA GASI AKO JE ISTEKLO!
            datum: o.created_at,
            pregledi: o.views || 0,
            grad: o.city || 'Srbija'
        };
    });

    // 5. PRIKAZ NA INDEX STRANI (Ograničeno samo vizuelno)
    if(latestCont) {
        const isMobile = window.innerWidth <= 768;
        const limitPrikaza = isMobile ? 4 : 6; 
        
        const zaPrikaz = proizvodi.slice(0, limitPrikaza);
        
        if (zaPrikaz.length === 0) {
            latestCont.innerHTML = '<p style="text-align:center; width:100%; color:#666;">Trenutno nema oglasa.</p>';
        } else {
            latestCont.innerHTML = zaPrikaz.map(p => napraviKarticu(p)).join('');
        }
    }

    // 6. PRIKAZ NA BERZI
    // Ovde funkcija 'osveziPrikaz' preuzima kontrolu.
    // Ona će prikazati prvih 20, pa kad klikneš "Učitaj još", prikazaće sledećih 20,
    // jer sada u memoriji imaš 200 oglasa spremnih!
    if(container) {
        window.osveziPrikaz();
    }
};
// 🔥 MOZAK FILTRIRANJA (Ova funkcija ti je falila!)
// 🔥 MOZAK FILTRIRANJA - POPRAVLJENO
// 🔥 PAMETNO FILTRIRANJE (Zameni funkciju osveziPrikaz)
// 🔥 PAMETNO FILTRIRANJE SA PAGINACIJOM
// 🔥 ULTIMATIVNO FILTRIRANJE (TRAŽI SVUDA)
// 🔥 FINALNI FIX ZA PRETRAGU (OTPORAN NA NULL GREŠKE)
// 🔥 FINALNI FIX ZA PRETRAGU I DUGME "UČITAJ JOŠ"
// 🔥 PAMETNO FILTRIRANJE SA LOKACIJOM I CENOM
window.osveziPrikaz = function() {
    // 🛑 FIX ZA IZLOG: Ako kuca u pretragu ili vuče slajder, gasimo izlog
    if (sessionStorage.getItem('open_seller')) {
        sessionStorage.removeItem('open_seller');
        const izlog = document.getElementById('seller-storefront');
        if(izlog) izlog.style.display = 'none';
    }

    const container = document.getElementById('all-products-container');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    if(!container) return;

    const sortSelect = document.getElementById('sort-select');
    const sortValue = sortSelect ? sortSelect.value : 'newest';
    const searchInput = document.getElementById('search-input');
    const text = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const gradFilter = document.getElementById('gradFilter');
    const odabraniGrad = gradFilter ? gradFilter.value.toLowerCase() : 'svi';
    
    const minCenaInput = document.getElementById('minCena');
    const maxCenaInput = document.getElementById('maxCena');
    const minCena = minCenaInput && minCenaInput.value ? parseInt(minCenaInput.value) : 0;
    const maxCena = maxCenaInput && maxCenaInput.value ? parseInt(maxCenaInput.value) : Infinity;

    let filtrirani = proizvodi.filter(p => {
        const naslov = p.naslov || "";
        const opis = p.opis || "";
        const kat = p.kategorija || "";
        const ime = p.prodavacIme || "";
        const stanje = p.stanje || "";

        const gradOglasa = (p.grad || "srbija").toLowerCase();
        const cenaOglasa = parseInt(p.cena) || 0;

        const punTekstOglasa = (naslov + " " + opis + " " + kat + " " + ime + " " + stanje).toLowerCase();
        
        const searchTerms = text.split(' ');
        const textMatch = searchTerms.every(term => punTekstOglasa.includes(term));

        const tagsMatch = aktivniFilteri.length === 0 || aktivniFilteri.every(tag => {
            const reciTaga = tag.toLowerCase().split(' ');
            return reciTaga.every(rec => punTekstOglasa.includes(rec));
        });

        const gradMatch = (odabraniGrad === 'svi') || gradOglasa.includes(odabraniGrad);
        const cenaMatch = (cenaOglasa >= minCena) && (cenaOglasa <= maxCena);

        return textMatch && tagsMatch && gradMatch && cenaMatch;
    });

    if (sortValue === 'price-asc') {
        filtrirani.sort((a, b) => (a.cena || 0) - (b.cena || 0));
    } else if (sortValue === 'price-desc') {
        filtrirani.sort((a, b) => (b.cena || 0) - (a.cena || 0));
    } else {
        filtrirani.sort((a, b) => {
            if (a.verifikovan === b.verifikovan) {
                return new Date(b.datum) - new Date(a.datum); 
            }
            return a.verifikovan ? -1 : 1; 
        });
    }

    const zaPrikaz = filtrirani.slice(0, trenutniLimit);

    if(zaPrikaz.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:#888; width:100%;">
                <i class="fas fa-search" style="font-size:2rem; margin-bottom:15px; opacity:0.5;"></i><br>
                Nema rezultata koji ispunjavaju te uslove.<br>
            </div>`;
        if(loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
            loadMoreBtn.setAttribute('style', 'display: none !important;');
        }
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
    } else {
        container.style.display = (window.innerWidth > 768) ? 'grid' : 'flex';
        container.style.flexDirection = (window.innerWidth > 768) ? 'row' : 'column';
        
        container.innerHTML = zaPrikaz.map(p => napraviKarticu(p)).join('');

        if(loadMoreBtn) {
            const preostalo = filtrirani.length - trenutniLimit;
            if (preostalo > 0) {
                loadMoreBtn.style.display = 'inline-block';
                loadMoreBtn.innerHTML = `UČITAJ JOŠ (${preostalo})`;
                loadMoreBtn.setAttribute('onclick', 'window.klikniUcitajJos(event)');
            } else {
                loadMoreBtn.style.display = 'none';
                loadMoreBtn.setAttribute('style', 'display: none !important;');
            }
        }
    }
};

// 🔥 GLOBALNA FUNKCIJA KOJA ODRAĐUJE KLIK
window.klikniUcitajJos = function(e) {
    if(e) e.preventDefault(); // Sprečava refresovanje stranice (ako je dugme u formi)
    trenutniLimit += 20; // Dižemo limit za još 20 komada
    window.osveziPrikaz(); // Crtamo ih na ekran
};
// Ažurirana kartica (FIX ZA KLIK I NAVIGACIJU)
// Ažurirana kartica (BEZ GREŠKE U HTML-u)
// Ažurirana kartica (SA VIP DIZAJNOM ZA VERIFIKOVANE)
// Ažurirana kartica (SA POPRAVLJENIM VIP DIZAJNOM I CELIM KODOM)
// Ažurirana kartica (SAVRŠENO PORAVNATO)
// Ažurirana kartica (SA FIKSIRANIM DUGMIĆIMA I LOKACIJOM)
// Ažurirana kartica (BEZ CSS HAKOVA, LOKACIJA JE U ISTOM REDU SA PRODAVCEM)
// Ažurirana kartica (SA JAKIM VIP SJAJEM I ČISTOM IKONICOM)
// Ažurirana kartica (ORIGINALNI SJAJ KARTICE, POPRAVLJEN GLOW IKONICA)
// Ažurirana kartica (SAVRŠEN GLOW BEZ KOCKASTIH IVICA)
// 🔥 BLINDIRANA KARTICA (NE MOŽE DA PUKNE)
function napraviKarticu(p) {
    // ZAŠTITA: Ako neko polje fali, stavljamo zamenu umesto da JS pukne!
    const naslov = p.naslov || "Nepoznat oglas";
    const naslovSafe = naslov.replace(/'/g, "\\'"); 
    const kategorija = p.kategorija ? p.kategorija.toUpperCase() : "OSTALO";
    const prodavacIme = p.prodavacIme || "Korisnik";
    
    const verifiedBadge = p.verifikovan 
        ? `<i class="fas fa-gem" style="color:gold; margin-left:4px; filter: drop-shadow(0 0 5px rgba(255,215,0,0.8));" title="GeekBit Supporter"></i>` : '';
    
    let cistOpis = p.opis || "";
    if (cistOpis.includes('[SPECIFIKACIJE]:')) {
        cistOpis = cistOpis.split('[SPECIFIKACIJE]:')[0];
    }
    
    const vreme = window.vremeProteklo ? window.vremeProteklo(p.datum) : "";

    const cardStyle = p.verifikovan 
        ? 'cursor: pointer; border: 1px solid gold; box-shadow: 0 0 15px rgba(255, 215, 0, 0.15); background: linear-gradient(180deg, rgba(255,215,0,0.08) 0%, rgba(17,17,17,1) 40%); position: relative;' 
        : 'cursor: pointer; position: relative;';

    const verifiedTag = p.verifikovan 
        ? `<div style="position:absolute; top:10px; right:10px; background:linear-gradient(45deg, #111, #222); color:gold; padding:4px 12px; border-radius:5px; font-size:0.7rem; font-weight:bold; z-index:20; box-shadow: 0 4px 10px rgba(255,215,0,0.2); border: 1px solid gold; text-transform:uppercase;"><i class="fas fa-gem" style="margin-right:4px;"></i> SUPPORTER</div>`
        : '';

    return `
    <div class="product-card" onclick="window.location.href='oglas.html?id=${p.id}'" style="${cardStyle}">
        
        <div class="card-image-container" style="position: relative;">
            ${verifiedTag} 
            <img src="${p.slika}" loading="lazy" onerror="this.src='assets/img/neon-logo1.png'">
            <div class="category-badge">${kategorija}</div>
            ${p.stanje === 'Novo' ? '<span class="status-badge new">NOVO</span>' : ''}
        </div>
        
        <div class="product-info">
            <div class="info-top">
                
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 5px;">
                   <h3 class="card-title" style="margin:0; font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:65%;">
                       <a href="oglas.html?id=${p.id}" style="color:inherit; text-decoration:none;">${naslov}</a>
                   </h3>
                   <div style="display:flex; gap:6px; color:#666; font-size:0.7rem; white-space:nowrap; align-items:center;">
                       <span title="Broj pregleda"><i class="fas fa-eye"></i> ${p.pregledi || 0}</span>
                       <span>🕒 ${vreme}</span>
                   </div>
                </div>

                <div class="price" style="margin-bottom: 5px;">${p.cena || 0} €</div>
                
                <div class="seller-row" style="margin-bottom: 5px; display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;">
                    
                    <div style="display:flex; align-items:center; max-width:65%;">
                        <i class="fas fa-user-astronaut" style="font-size: 1rem; color: ${p.verifikovan ? 'gold' : 'var(--accent)'}; margin-right:4px; ${p.verifikovan ? 'filter: drop-shadow(0 0 5px rgba(255,215,0,0.8));' : ''}"></i>
                        
                        <span onclick="event.stopPropagation(); window.otvoriIzlog('${p.prodavacId}', '${prodavacIme}', '${p.prodavacEmail}', '${p.telefon}')" 
                              style="cursor:pointer; border-bottom:1px dotted #ccc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${prodavacIme}
                        </span> 
                        
                        ${verifiedBadge}
                    </div>

                    <div style="color:#aaa; font-size:0.75rem; white-space:nowrap; flex-shrink:0;">
                        <i class="fas fa-map-marker-alt" style="color:#ff4d4d;"></i> ${p.grad || 'Srbija'}
                    </div>
                </div>
                
                <p class="card-desc" style="margin:0 0 5px 0; font-size:0.75rem; color:#888; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${cistOpis}
                </p>
            </div>

            <div class="card-actions-row" onclick="event.stopPropagation()">
                <button class="btn-icon" 
                        onclick="dodajUKorpu('${p.id}', '${naslovSafe}', '${p.cena || 0}', '${p.slika}', '${prodavacIme}', '${p.telefon}', '${p.prodavacEmail}', '${kategorija}', \`${cistOpis.replace(/`/g, "\\`")}\`)">
                    <i class="fas fa-shopping-cart"></i>
                </button>
                
                <button class="btn-contact" style="flex: 2;" onclick="otvoriKontaktModal('${prodavacIme}', '${p.prodavacEmail}', '${p.telefon}')">KONTAKT</button>
                <button class="btn-icon report" onclick="prijaviOglas('${p.id}', event)"><i class="fas fa-flag"></i></button>
            </div>
        </div>
    </div>`;
}
// 📞 FUNKCIJA KOJA OTVARA KONTAKT MODAL
window.otvoriKontaktModal = function(ime, email, telefon) {
    const modal = document.getElementById('contact-modal');
    if(modal) {
        const imeElem = document.getElementById('modal-seller-name');
        const emailElem = document.getElementById('modal-seller-email');
        const telElem = document.getElementById('modal-seller-phone');

        if(imeElem) imeElem.innerText = ime;
        if(emailElem) { emailElem.innerText = email; emailElem.href = "mailto:" + email; }
        if(telElem) { telElem.innerText = telefon; telElem.href = "tel:" + telefon; }
        
        modal.style.display = 'block';
    } else {
        alert("Kontakt info:\nIme: " + ime + "\nTel: " + telefon);
    }
}

window.zatvoriKontakt = function() {
    const modal = document.getElementById('contact-modal');
    if(modal) modal.style.display = 'none';
}

// ==========================================
// 7. KOMPLETNA LOGIKA KORPE (DODAVANJE + PRIKAZ + SERVIS)
// ==========================================

// --- 1. FUNKCIJA ZA DODAVANJE U KORPU (Ovo je falilo!) ---
window.dodajUKorpu = function(id, naslov, cena, slika, prodavac, telefon, email, kategorija, opis) {
    let korpa = JSON.parse(localStorage.getItem('geekbit_korpa')) || [];
    
    // Provera duplikata
    if(korpa.find(i => i.id === id)) {
        prikaziAlert("OBAVEŠTENJE", "Ovaj proizvod je već u korpi!"); 
        return;
    }

    // Dodajemo novi predmet
    korpa.push({ 
        id, 
        naslov, 
        cena, 
        slika, 
        prodavac, 
        telefon, 
        email, 
        kategorija, 
        opis 
    });
    
    // Čuvamo u memoriji
    localStorage.setItem('geekbit_korpa', JSON.stringify(korpa));
    
    // Odmah ažuriramo broj u meniju
    azurirajBadgeKorpe();
    
    prikaziAlert("USPEH", "Proizvod dodat u korpu! 🛒");
}

// --- 2. FUNKCIJA ZA BROJAČ U MENIJU ---
window.azurirajBadgeKorpe = function() {
    const korpa = JSON.parse(localStorage.getItem('geekbit_korpa')) || [];
    const badge = document.getElementById('cart-count-badge');
    
    if (badge) {
        badge.innerText = korpa.length;
        badge.style.display = korpa.length > 0 ? 'inline-block' : 'none';
        badge.style.background = korpa.length > 0 ? 'var(--accent)' : 'transparent';
        badge.style.color = '#000';
    }
}

// --- 3. FUNKCIJE ZA STRANICU KORPA.HTML ---

// Učitavanje
window.ucitajKorpuStranicu = function() {
    azurirajKorpuPrikaz();
}

// Prikaz liste i cena
// Prikaz liste i cena (SA DUHOM) 👻
window.azurirajKorpuPrikaz = function() {
    const listDiv = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('final-total');
    
    // Ako nismo na strani korpe, samo ažuriraj badge i izađi
    if (!listDiv || !totalEl) {
        azurirajBadgeKorpe();
        return;
    }

    const korpa = JSON.parse(localStorage.getItem('geekbit_korpa')) || [];

    if (korpa.length === 0) {
        // 🔥 OVDE SMO VRATILI DUHA
        listDiv.innerHTML = `
            <div class="empty-cart-ghost">
                <i class="fas fa-ghost"></i>
                <h3>Tvoja korpa je prazna...</h3>
                <p>Duhovi su jedino što ovde možeš naći.</p>
                <a href="komponente.html" class="cta-button" style="margin-top:20px; display:inline-block;">ISTRAŽI BERZU</a>
            </div>`;
        totalEl.innerText = "0 €";
        return;
    }

    // Crtanje stavki
    listDiv.innerHTML = korpa.map(item => `
        <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; background: #111; padding: 15px; margin-bottom: 10px; border: 1px solid #333; border-radius: 8px;">
            <div style="display: flex; align-items: center; gap: 15px;">
                <img src="${item.slika || 'assets/img/neon-logo1.png'}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid var(--accent);">
                <div>
                    <h3 style="margin: 0; font-family: 'Nulshock'; font-size: 1rem; color: #fff;">${item.naslov}</h3>
                    <p style="margin: 5px 0 0 0; color: #888; font-size: 0.8rem;">Prodavac: ${item.prodavac}</p>
                    <div style="color: var(--accent); font-weight: bold; margin-top: 5px;">${item.cena} €</div>
                </div>
            </div>
            <button onclick="brisiIzKorpe('${item.id}')" style="background: transparent; border: none; color: #ff4d4d; cursor: pointer; font-size: 1.2rem;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    // Računica
    let total = korpa.reduce((acc, item) => acc + Number(item.cena), 0);

    const serviceCheck = document.getElementById('geekbit-service-check');
    if (serviceCheck && serviceCheck.checked) {
        total += 50; 
    }

    totalEl.innerText = total + " €";
}

// --- 4. TOGGLE ZA TELEFON ---
window.prikaziPoljeZaTelefon = function() {
    const check = document.getElementById('geekbit-service-check');
    const container = document.getElementById('service-phone-container');
    
    if(check && check.checked) {
        if(container) container.style.display = 'block';
    } else {
        if(container) container.style.display = 'none';
    }
    azurirajKorpuPrikaz(); 
}

// --- 5. BRISANJE ---
window.brisiIzKorpe = function(id) {
    // 1. Čitamo korpu iz memorije
    let korpa = JSON.parse(localStorage.getItem('geekbit_korpa')) || [];
    
    // 2. Filtriramo (Stavljamo 'String()' da budemo 100% sigurni da se formati poklapaju)
    korpa = korpa.filter(item => String(item.id) !== String(id));
    
    // 3. Vraćamo novu, umanjenu korpu u memoriju
    localStorage.setItem('geekbit_korpa', JSON.stringify(korpa));
    
    // 4. Osvežavamo brojač i listu (zovemo bezbedno preko window objekta)
    if (typeof window.azurirajBadgeKorpe === 'function') window.azurirajBadgeKorpe();
    if (typeof window.azurirajKorpuPrikaz === 'function') window.azurirajKorpuPrikaz();
}
// --- 6. ZAVRŠETAK KUPOVINE (Checkout + Servis) ---
window.zavrsiKupovinu = async function() {
    const korpa = JSON.parse(localStorage.getItem('geekbit_korpa')) || [];
    if(korpa.length === 0) { prikaziAlert("GREŠKA", "Korpa je prazna!"); return; }
    
    const serviceCheck = document.getElementById('geekbit-service-check');
    const wantsService = serviceCheck && serviceCheck.checked;
    
    const phoneInput = document.getElementById('service-phone-input');
    const phoneNumber = phoneInput ? phoneInput.value.trim() : "";

    // LOGIKA ZA SERVIS
    if (wantsService) {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) {
            prikaziAlert("PAŽNJA", "Za GeekBit servis morate biti prijavljeni.");
            prijaviSeGoogle();
            return;
        }

        if (phoneNumber === "") {
            prikaziAlert("FALI BROJ", "Unesite broj telefona za dogovor oko servisa!");
            if(phoneInput) phoneInput.focus();
            return;
        }

     try {
        // 1. BEZBEDNA PROVERA SESIJE (Ovo sprečava pucanje koda)
        const { data: authData, error: authErr } = await sb.auth.getUser();
        
        if (authErr || !authData || !authData.user) {
            prikaziAlert("Vaša sesija je istekla ili niste prijavljeni. Molimo osvežite stranicu i prijavite se ponovo!");
            return; // Prekida funkciju ovde, ne dozvoljava da pukne
        }
        
        const user = authData.user;
        const kupacId = user.id;

            if(error) throw error;
            prikaziAlert("USPEH", "Zahtev poslat! Zvaćemo vas na: " + phoneNumber);
            
        } catch (err) {
            console.error(err);
            prikaziAlert("GREŠKA", "Greška pri slanju zahteva.");
        }
    }

    // PRIKAZ MODALA
    const checkoutModal = document.getElementById('checkout-modal');
    if(checkoutModal) checkoutModal.style.display = "flex";
    
    const listDiv = document.getElementById('sellers-list');
    if (listDiv) {
        listDiv.innerHTML = "";
        
        if(wantsService) {
             listDiv.innerHTML += `
                <div style="background:rgba(0,255,136,0.1); border:1px solid var(--accent); padding:15px; border-radius:8px; margin-bottom:20px; text-align:center;">
                    <i class="fas fa-check-circle" style="color:var(--accent); font-size:1.5rem; margin-bottom:10px;"></i><br>
                    <strong style="color:#fff;">ZAHTEV ZA SKLAPANJE PRIMLJEN</strong><br>
                    <small style="color:#ccc;">Kontaktiraćemo vas na <b>${phoneNumber}</b>.</small>
                    <hr style="border-color:#333; margin:10px 0;">
                    <small style="color:#888;">Sada kontaktirajte prodavce ispod da rezervišete delove:</small>
                </div>`;
        }

        korpa.forEach(item => {
            listDiv.innerHTML += `
                <div class="seller-contact-card" style="background:#111; border:1px solid #333; padding:15px; margin-bottom:10px; border-radius:5px;">
                    <h4 style="color:var(--accent); margin-bottom:5px;">${item.naslov} (${item.cena}€)</h4>
                    <p style="margin:5px 0; color:#fff;">👤 Prodavac: ${item.prodavac}</p>
                    <p style="margin:5px 0;"><a href="tel:${item.telefon}" style="color:#fff; text-decoration:none;">📞 ${item.telefon}</a></p>
                </div>`;
        });
    }
}

// INICIJALIZACIJA (Da se odmah osveži bedž pri učitavanju)
azurirajBadgeKorpe();
// ==========================================
// 8. MOJI OGLASI (User Panel) - SA TAJMEROM ⏳ & NOTIFIKACIJAMA 🔴
// ==========================================
window.ucitajMojeOglase = async function() {
    const container = document.getElementById('my-ads-container');
    if(!container) return;

    const { data: { session } } = await sb.auth.getSession();
    if (!session) { container.innerHTML = "<p>Moraš biti ulogovan.</p>"; return; }

    // 1. Učitavamo sve korisnikove oglase
    const { data: oglasi } = await sb
        .from('listings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

    if (!oglasi || oglasi.length === 0) {
        container.innerHTML = "<p style='color:#888;'>Nemaš aktivnih oglasa.</p>";
        return;
    }

    // 🔥 NOVO: Učitavamo sve 'pending' zahteve za ovog prodavca
    const { data: zahtevi } = await sb.from('transactions')
        .select('listing_id')
        .eq('seller_id', session.user.id)
        .eq('status', 'pending');
    
    // 🔥 POPRAVKA: Pretvaramo sve ID-jeve u tekst (String) zbog poređenja!
    const oglasiSaZahtevom = zahtevi ? zahtevi.map(z => String(z.listing_id)) : [];

    container.innerHTML = oglasi.map(o => {
        const slika = o.images && o.images.length > 0 ? o.images[0] : 'assets/img/neon-logo1.png';
        
        // --- LOGIKA ZA ISTEK ---
        const preostalo = vremeDoIsteka(o.expires_at);
        let bojaIsteka = "#00ff88"; // Zelena
        if (preostalo === "ISTEKLO") bojaIsteka = "#ff4d4d"; 
        else if (preostalo.includes("dana") && parseInt(preostalo) < 3) bojaIsteka = "orange"; 
        else if (!preostalo.includes("dana")) bojaIsteka = "orange"; 

        // 🔥 POPRAVKA: Pretvaramo i ID trenutnog oglasa u tekst (String)
        const imaZahtev = oglasiSaZahtevom.includes(String(o.id));
        
        // 🔴 1. Crvena pulsirajuća tačkica u uglu kartice
   const crvenaTackaHTML = imaZahtev 
    ? `<div style="position: absolute; top: 12px; right: 12px; width: 18px; height: 18px; background: #ff4d4d; border-radius: 50%; box-shadow: 0 0 15px #ff4d4d; animation: pulse 2s infinite; z-index: 20; border: 2px solid #222;" title="Imate kupca na čekanju!"></div>` 
    : '';
        // 🔴 2. Menjamo stil dugmeta (Postaje crveno i kaže "KUPAC ČEKA")
        const prodatoDugmeStil = imaZahtev 
            ? `background: #ff4d4d; color: #fff; border: 1px solid #ff4d4d; box-shadow: 0 0 15px rgba(255, 77, 77, 0.4); animation: pulse 2s infinite; font-weight: bold;`
            : `background: gold; color: #000; border: none;`;
            
        const prodatoTekst = imaZahtev ? `POTVRDI (ČEKA)` : `PRODATO`;

  // 🔴 3. Kartici dajemo blagi crveni okvir ako ima zahtev
        
        // 🔥 4. LOGIKA ZA DUGME "OBNOVI" (Prikazuje se samo ako je oglas istekao)
        let dugmeObnoviHTML = '';
        if (preostalo === 'ISTEKLO') {
            dugmeObnoviHTML = `
            <button onclick="obnoviOglas('${o.id}')" style="background: var(--accent); color: black; padding: 10px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%; margin-top: 15px; font-size: 0.9rem; box-shadow: 0 0 10px rgba(0,255,136,0.2); transition: 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                <i class="fas fa-sync-alt"></i> OBNOVI OGLAS
            </button>`;
        }

        return `
        <div class="product-card" style="position: relative; ${imaZahtev ? 'border: 1px solid #ff4d4d;' : ''}">
            ${crvenaTackaHTML}
            <div class="card-image-container">
                <img src="${slika}" onerror="this.src='assets/img/neon-logo1.png'">
                <div class="category-badge">${o.category.toUpperCase()}</div>
                
                ${preostalo === 'ISTEKLO' ? '<span style="position:absolute; top:5px; right:5px; background:red; color:white; font-size:0.7rem; padding:2px 5px; border-radius:3px; font-weight:bold;">ISTEKAO</span>' : ''}
            </div>
            
            <div class="product-info">
                <h3 style="font-size: 1.1rem; margin-bottom: 5px;">${o.title}</h3>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="color:var(--accent); font-weight:bold; font-size:1.3rem;">
                        ${o.price} €
                    </div>
                    <div style="font-size:0.8rem; color:${bojaIsteka}; border:1px solid ${bojaIsteka}; padding:2px 6px; border-radius:4px;">
                        ⏳ ${preostalo}
                    </div>
                </div>
                
              <div class="card-actions-row" style="display: flex; gap: 8px; margin-top: 15px;">
                    <button onclick="potvrdiProdaju('${o.id}')" class="btn-contact" style="${prodatoDugmeStil} flex: 1.5; font-size: 0.8rem; cursor: pointer;">
                        <i class="fas fa-handshake"></i> ${prodatoTekst}
                    </button>

                    <button onclick="otvoriEditModal('${o.id}', '${o.title.replace(/'/g, "\\'")}', '${o.price}', \`${o.description.replace(/`/g, "\\`")}\`)" 
                            class="btn-icon" style="background:#333; color:#fff; border:1px solid #555; flex: 1; cursor: pointer;">
                        <i class="fas fa-edit"></i>
                    </button>
                    
                    <button onclick="otvoriDeleteModal('${o.id}')" 
                            class="btn-icon report" style="flex:1; border-color:#ff4d4d; color:#ff4d4d; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                ${dugmeObnoviHTML}

            </div>
        </div>`;
    }).join('');
}

// ==========================================
// 🔄 FUNKCIJA ZA OBNAVLJANJE ISTEKLIH OGLASA
// ==========================================
window.obnoviOglas = async function(oglasId) {
    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return prikaziAlert("GREŠKA", "Morate biti prijavljeni!");

        // 1. PROVERA LIMITA: Brojimo samo AKTIVNE oglase (kojima nije istekao expires_at)
        const now = new Date().toISOString();
        const { count } = await sb.from('listings').select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gt('expires_at', now); // Filtrira samo one koji još traju
        
        const { data: profile } = await sb.from('profiles').select('ads_limit').eq('id', user.id).single();
        const limit = profile?.ads_limit || 50;

        // Ako ima 3 aktivna (a limit mu je 3), izbacujemo Premium modal
        if (count >= limit) {
            window.otvoriPremium();
            return;
        }

        // 2. OBNOVA: Ažuriramo i created_at (za BUMP na vrh) i expires_at (za novih 30 dana)
        const noviIstek = new Date(Date.now() + 30*24*60*60*1000).toISOString();
        const { error } = await sb
            .from('listings')
            .update({ 
                created_at: now,
                expires_at: noviIstek
            })
            .eq('id', oglasId)
            .eq('user_id', user.id); // Sigurnost: samo vlasnik može

        if (error) throw error;

        prikaziAlert("USPEH 🚀", "Oglas je uspešno obnovljen i vraćen na vrh berze!");
        setTimeout(() => location.reload(), 1500);

    } catch (err) {
        console.error(err);
        prikaziAlert("GREŠKA", "Došlo je do greške pri obnavljanju oglasa.");
    }
}
// Edit & Delete Logika
window.otvoriDeleteModal = function(id) {
    oglasZaBrisanjeId = id;
    const modal = document.getElementById('delete-modal');
    if(modal) modal.style.display = "block";
}
window.zatvoriDeleteModal = function() {
    document.getElementById('delete-modal').style.display = "none";
}
window.konacnoObrisi = async function() {
    if(!oglasZaBrisanjeId) return;

    // 1. Prvo dobavi oglas da vidiš koje slike ima
    const { data: oglas } = await sb.from('listings').select('images').eq('id', oglasZaBrisanjeId).single();

    if(oglas && oglas.images && oglas.images.length > 0) {
        // Izvlačimo imena fajlova iz URL-ova
        const putanjeZaBrisanje = oglas.images.map(url => {
            // URL je obično: .../ads-images/ime_slike.jpg
            // Nama treba samo "ime_slike.jpg"
            return url.split('/').pop(); 
        });

        // 2. Obriši slike iz Storage-a
        if(putanjeZaBrisanje.length > 0) {
            await sb.storage.from('ads-images').remove(putanjeZaBrisanje);
        }
    }

    // 3. Tek sad obriši red iz baze
    await sb.from('listings').delete().eq('id', oglasZaBrisanjeId);
    
    window.location.reload();
}

window.otvoriEditModal = function(id, stariNaslov, staraCena, stariOpis) {
    const modal = document.getElementById('edit-modal');
    if(modal) {
        document.getElementById('edit-id').value = id;
        
        // Popunjavamo sva 3 polja
        document.getElementById('edit-naslov').value = stariNaslov; // Novo
        document.getElementById('edit-cena').value = staraCena;
        document.getElementById('edit-opis').value = stariOpis;
        
        // Postavljamo flex da bi se centriralo (zbog CSS-a iz koraka 1)
        modal.style.display = "flex"; 
    }
}
window.sacuvajIzmenu = async function() {
    const id = document.getElementById('edit-id').value;
    const naslov = document.getElementById('edit-naslov').value; // Novo polje
    const cena = document.getElementById('edit-cena').value;
    const opis = document.getElementById('edit-opis').value;
    
    // --- VALIDACIJA: Sva 3 moraju biti popunjena ---
    if(!naslov || !cena || !opis) {
        prikaziAlert("GREŠKA", "Sva polja (Naslov, Cena, Opis) su obavezna!");
        return; // Prekida funkciju, ne šalje ništa bazi
    }

    // Ažuriranje u bazi (šaljemo i title)
    const { error } = await sb.from('listings')
        .update({ 
            title: naslov, 
            price: cena, 
            description: opis 
        })
        .eq('id', id);

    if (!error) {
        prikaziAlert("USPEH", "Oglas uspešno izmenjen!");
        setTimeout(() => window.location.reload(), 1000); // Osveži stranu
    } else {
        prikaziAlert("GREŠKA", error.message);
    }
}
window.zatvoriEditModal = function() {
    document.getElementById('edit-modal').style.display = "none";
}

// ==========================================
// 9. IZLOG (STOREFRONT) 🏪
// ==========================================
// ==========================================
// POPRAVKA 1: OTVARANJE IZLOGA (DA RADE OCENE SVUDA)
// ==========================================
window.otvoriIzlog = function(prodavacId, ime, email, telefon) {
    // 1. Čuvamo podatke o prodavcu UVEK (i za index i za berzu)
    // Ovo je ključno da bi dugmići za ocene znali koga ocenjuju!
    sessionStorage.setItem('open_seller', JSON.stringify({prodavacId, ime, email, telefon}));
    window.trenutniProdavacIdZaReview = prodavacId; // Globalna promenljiva za review modal

    // 2. Ako nismo na stranici Berza, idi tamo
    if (!window.location.pathname.includes('komponente.html')) {
        window.location.href = 'komponente.html';
        return; 
    }

    // 3. Ako smo već na Berzi, samo prikaži izlog
    const izlog = document.getElementById('seller-storefront');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const container = document.getElementById('all-products-container');

    if(izlog) {
        izlog.style.display = 'block';
        document.getElementById('store-name').innerText = (ime || "Korisnik").toUpperCase() + " - IZLOG";
        
        const mailEl = document.getElementById('store-email');
        const phoneEl = document.getElementById('store-phone');
        if(mailEl) mailEl.innerHTML = `<i class="fas fa-envelope"></i> ${email}`;
        if(phoneEl) phoneEl.innerHTML = `<i class="fas fa-phone"></i> ${telefon}`;
        
        // Skroluj na vrh da vidiš izlog
        izlog.scrollIntoView({ behavior: 'smooth' });
    }

    if(loadMoreBtn) loadMoreBtn.style.display = 'none';

    // Učitaj oglase tog prodavca
    if(container) {
        container.innerHTML = "<p style='text-align:center; padding: 40px; color:#888;'>Učitavanje izloga...</p>";
        sb.from('listings')
          .select('*, profiles(is_verified, company_name)')
          .eq('user_id', prodavacId)
          .then(({ data }) => {
                if(!data || data.length === 0) {
                    container.innerHTML = "<p style='text-align:center; padding: 40px; color:#888;'>Nema drugih oglasa.</p>";
                } else {
                    const mapirani = mapirajOglase(data); // Koristimo helper funkciju
                    container.innerHTML = mapirani.map(p => napraviKarticu(p)).join('');
                }
          });
    }
    
    // Učitaj ocene
    ucitajOceneProdavca(prodavacId);
}

// Helper za mapiranje (da ne ponavljamo kod)
// Helper za mapiranje (da ne ponavljamo kod)
// Helper za mapiranje (da ne ponavljamo kod)
function mapirajOglase(data) {
    return data.map(o => {
        // 🔥 Dodajemo proveru vremena i ovde
        const premiumDo = o.profiles?.premium_do ? new Date(o.profiles.premium_do) : null;
        const jelPremium = premiumDo && premiumDo > new Date();

        return {
            id: o.id,
            naslov: o.title,
            cena: o.price,
            opis: o.description || "",
            slika: o.images?.[0] || 'assets/img/neon-logo1.png',
            images: o.images, 
            kategorija: o.category,
            stanje: o.condition,
            prodavacId: o.user_id,
            prodavacIme: o.profiles?.company_name || o.seller_name,
            prodavacEmail: o.user_email,
            telefon: o.phone,
            verifikovan: jelPremium, // 🔥 Primenjeno vremensko ograničenje
            datum: o.created_at,
            pregledi: o.views || 0,
            grad: o.city || 'Srbija'
        };
    });
}

// ==========================================
// POPRAVKA 2: DUGME "UČITAJ JOŠ" (INDEX)
// ==========================================
window.ucitajJosOglasa = function() {
    // Na mobilnom, ovo dugme samo vodi na berzu da vidiš sve
    window.location.href = "komponente.html";
}

// ==========================================
// POPRAVKA 3: SLIKE GALERIJE (STOP PROPAGATION)
// ==========================================
// Ovo sprečava da klik na sliku zatvori modal
window.otvoriGaleriju = function(slike, naslov) {
    const modal = document.getElementById('image-modal');
    const img = document.getElementById('modal-img');
    
    // Sprečava da klik na samu sliku zatvori modal
    if(img) {
        img.onclick = function(e) {
            e.stopPropagation(); 
        }
    }

    let url = Array.isArray(slike) ? slike[0] : (slike || 'assets/img/neon-logo1.png');
    if(img) img.src = url;
    if(modal) modal.style.display = "flex";
}
// ==========================================
// 10. POKRETANJE (INIT) 🚀
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    
    //==========================================
    // FORSIRANJE HERO SEKCIJE (SCROLL NA VRH)
    // ==========================================
    // 1. Isključujemo ugrađeno pamćenje skrola u pretraživaču
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    
    // 2. Forsiramo skrol na nulu odmah
    window.scrollTo(0, 0);
    
    // 3. Zaštita: Ako u URL-u sa Google-a postoji #contact, vraćamo ga na vrh sa malim zakašnjenjem
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 50);
    // ==========================================
    
    // 1. Auth Status
    const { data: { session } } = await sb.auth.getSession();
    updateAuthUI(session);
    sb.auth.onAuthStateChange((_event, session) => updateAuthUI(session));

    // 2. Inicijalizacija Korpe
    if(typeof azurirajBadgeKorpe === 'function') azurirajBadgeKorpe();

    // 3. Provera da li treba otvoriti izlog (sa Index strane)
    const container = document.getElementById('all-products-container') || document.getElementById('latest-container');
    if (container) {
        const storedSeller = sessionStorage.getItem('open_seller');
        if(storedSeller && window.location.pathname.includes('komponente.html')) {
             const s = JSON.parse(storedSeller);
             if(typeof otvoriIzlog === 'function') otvoriIzlog(s.prodavacId, s.ime, s.email, s.telefon);
             
        } else {
            if(typeof ucitajNajnovijeOglase === 'function') ucitajNajnovijeOglase();
        }
    }

   // 4. Stranice
if(window.location.pathname.includes("korpa.html") && typeof ucitajKorpuStranicu === 'function') {
    ucitajKorpuStranicu();
}

if(window.location.pathname.includes("oglas.html") && typeof ucitajPojedinacniOglas === 'function') {
        ucitajPojedinacniOglas();
    }

// Izmeni ovaj deo u main.js
    if(window.location.pathname.includes("profil.html") || window.location.pathname.endsWith("/") || window.location.pathname.includes("index.html")) {
        if(typeof ucitajMojeOglase === 'function') ucitajMojeOglase();
        ucitajMojeKupovine(); // Sada će se učitati i na početnoj i na profilu!
    }

    // 5. Zatvaranje modala na klik
    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(m => { 
            if (event.target == m) m.style.display = "none"; 
        });
    };

    // ... unutar DOMContentLoaded ...
    
    // Pokreni proveru smart alerta
    if(typeof proveriAlerte === 'function') {
        proveriAlerte();
    }
    
    // ==========================================
// 🚨 DETEKCIJA TIKTOK/INSTAGRAM PRETRAŽIVAČA
// ==========================================
function proveriInAppBrowser() {
    var ua = navigator.userAgent || navigator.vendor || window.opera;
    // Proveravamo da li je TikTok, Instagram ili Facebook browser
    var isInApp = (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1) || (ua.indexOf("Instagram") > -1) || (ua.indexOf("TikTok") > -1);

    if (isInApp) {
        // Kreiramo i prikazujemo upozorenje
        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.95); z-index: 999999; 
            display: flex; flex-direction: column; justify-content: center; align-items: center; 
            text-align: center; padding: 20px; color: white; font-family: sans-serif;
        `;
        
        warningDiv.innerHTML = `
            <div style="background: #111; border: 2px solid gold; padding: 30px; border-radius: 15px; max-width: 90%;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: gold; margin-bottom: 20px;"></i>
                <h2 style="margin-bottom: 15px;">VAŽNO OBAVEŠTENJE</h2>
                <p style="font-size: 1rem; line-height: 1.5; color: #ccc;">
                    Otvorili ste sajt unutar <strong>TikTok-a / Instagram-a</strong>.
                    <br><br>
                    Google ne dozvoljava prijavljivanje kroz ovu aplikaciju zbog bezbednosti.
                </p>
                <div style="margin-top: 25px; font-weight: bold; color: var(--accent); font-size: 1.1rem;">
                    👇 REŠENJE 👇
                </div>
                <p style="margin-top: 10px; color: #fff;">
                    Kliknite na <strong>3 tačkice (⋮)</strong> u uglu ekrana i izaberite <br> 
                    <span style="border: 1px solid white; padding: 3px 8px; border-radius: 5px; margin-top: 5px; display: inline-block;">Open in Browser (Otvori u pretraživaču)</span>
                </p>
                <button onclick="this.parentElement.parentElement.style.display='none'" style="margin-top: 20px; padding: 10px 20px; background: #333; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Razumem, nastavi samo gledanje
                </button>
            </div>
        `;
        
        document.body.appendChild(warningDiv);
    }
}

// Učitaj statistiku za novi Hero
    if (typeof ucitajHeroStatistiku === 'function') {
        ucitajHeroStatistiku();
    }

    // Pokreni lebdeće ikonice
    if (typeof inicijalizujLebdeceIkonice === 'function') {
        inicijalizujLebdeceIkonice();
    }

// Pozivamo funkciju odmah
proveriInAppBrowser();
    
});




// 11. HELPER ZA PRODAJ DUGME (FIX ZA SCROLL)
window.idiNaPostavljanjeOglasa = async function(e) {
    if(e) e.preventDefault(); // Sprečava da href="#" skoči na vrh strane

    const { data: { session } } = await sb.auth.getSession();
    
    if (!session) {
        alert("Morate biti ulogovani da biste postavili oglas!");
        prijaviSeGoogle();
    } else {
        // Ako smo već na Index stranici
        const isIndex = window.location.pathname.includes('index.html') || 
                        window.location.pathname === '/' || 
                        window.location.pathname.endsWith('/');

        if (isIndex) {
            // Ako smo tu, samo skroluj dole do forme
            const forma = document.getElementById('contact'); // ili 'oglas-form' zavisi koji ti je ID sekcije
            if(forma) {
                forma.scrollIntoView({ behavior: 'smooth' });
            } else {
                // Fallback ako ne nađe ID, probaj po hash-u
                window.location.href = "#contact";
            }
        } else {
            // Ako nismo na Indexu, idi tamo
            window.location.href = "index.html#contact";
        }
    }
}

window.prijaviOglas = async function(id, event) {
    if(event) event.stopPropagation();
    if(confirm("Prijavi oglas administratoru?")) {
        prikaziAlert("HVALA", "Prijava je poslata.");
    }
}


// --- FUNKCIJE ZA ZATVARANJE MODALA ---

// Zatvara Checkout Modal (Korpa)
window.zatvoriCheckout = function() {
    const modal = document.getElementById('checkout-modal');
    if(modal) modal.style.display = 'none';
}

// Zatvara Kontakt Modal (Berza)
window.zatvoriKontakt = function() {
    const modal = document.getElementById('contact-modal');
    if(modal) modal.style.display = 'none';
}

// Zatvara Premium Modal
// (Već imaš onclick u HTML-u, ali za svaki slučaj)
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(m => { 
        if (event.target == m) m.style.display = "none"; 
    });
};

// ==========================================
// 12. INSTANT OTKUP & ADMIN SISTEM ⚡
// ==========================================

// --- A) SLANJE ZAHTEVA (Sa stranice quicksell.html) ---
const otkupForm = document.getElementById('otkup-form');

if (otkupForm) {
    otkupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 1. Provera da li je ulogovan (treba nam email)
        const { data: { user } } = await sb.auth.getUser();
        if (!user) {
            prikaziAlert("GREŠKA", "Morate biti ulogovani da biste poslali zahtev.");
            return;
        }

        const submitBtn = otkupForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = "SLANJE... <i class='fas fa-spinner fa-spin'></i>";

        try {
            // 2. Upload slike (Ako je korisnik izabrao)
            const slikaInput = document.getElementById('otkup-slika');
            let slikeNiz = [];

            if (slikaInput && slikaInput.files.length > 0) {
                const file = slikaInput.files[0];
                let fileToUpload = file;
                
                // Kompresija (ako imaš tu funkciju, ako ne, šalje original)
                if (typeof window.kompresujSliku === 'function') {
                    const compressed = await window.kompresujSliku(file);
                    const res = await fetch(compressed);
                    fileToUpload = await res.blob();
                }

                const fileName = `otkup_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
                const { error: uploadError } = await sb.storage.from('ads-images').upload(fileName, fileToUpload);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = sb.storage.from('ads-images').getPublicUrl(fileName);
                slikeNiz.push(publicUrlData.publicUrl);
            }

            // 3. Upis u bazu (Tabele: buy_requests)
            // Koristimo ID-eve iz tvog novog HTML-a (otkup-ime, otkup-telefon...)
            const { error: insertError } = await sb.from('buy_requests').insert({
                full_name: document.getElementById('otkup-ime').value,
                phone: document.getElementById('otkup-telefon').value,
                email: user.email, 
                item_name: document.getElementById('otkup-naziv').value, // ID iz HTML-a
                expected_price: parseFloat(document.getElementById('otkup-cena').value),
                description: document.getElementById('otkup-opis').value,
                images: slikeNiz,
                status: 'pending'
            });

            if (insertError) throw insertError;

            prikaziAlert("USPEH", "Zahtev poslat! Javićemo se uskoro.");
            otkupForm.reset();

        } catch (err) {
            console.error(err);
            prikaziAlert("GREŠKA", "Greška: " + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// ==========================================
// 13. KOMPLETNA ADMIN LOGIKA (KORISNICI, OGLASI, SERVIS, OTKUP)
// ==========================================

// --- 1. UČITAVANJE KORISNIKA ---
// --- 1. UČITAVANJE KORISNIKA (SA BAN DUGMETOM) 🔨 ---
window.ucitajKorisnike = async function() {
    const container = document.getElementById('users-list-container');
    if(!container) return;
    container.innerHTML = '<p style="color:#888;">Učitavanje baze korisnika...</p>';

    // 1. Uzimamo sve profile (jer tu su imena)
    const { data: profili, error } = await sb
        .from('profiles')
        .select('*');

    if(error) { container.innerHTML = "Greška pri učitavanju."; return; }

    if(!profili || profili.length === 0) {
        container.innerHTML = '<p>Nema registrovanih korisnika u bazi.</p>';
        return;
    }

    container.innerHTML = `
    <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse: collapse; color:#ccc;">
            <thead>
                <tr style="background:#111; color:var(--accent); border-bottom: 2px solid #333;">
                    <th style="padding:15px; text-align:left;">KORISNIK</th>
                    <th style="padding:15px; text-align:left;">EMAIL (ID)</th>
                    <th style="padding:15px; text-align:center;">AKCIJA</th>
                </tr>
            </thead>
            <tbody>
                ${profili.map(u => `
                <tr style="border-bottom:1px solid #222; transition:0.2s;" onmouseover="this.style.background='#1a1a1a'" onmouseout="this.style.background='transparent'">
                    
                    <td style="padding:15px;">
                        <div style="font-weight:bold; color:#fff;">${u.company_name || 'Nepoznato'}</div>
                        <small style="color:#666;">Verifikovan: ${u.is_verified ? '✅' : '❌'}</small>
                    </td>
                    
                    <td style="padding:15px;">
                        <div style="color:#aaa;">${u.email || 'Nema Email'}</div> <small style="font-family:monospace; color:#444;">ID: ${u.id}</small>
                    </td>
                    
                    <td style="padding:15px; text-align:center;">
                        <button onclick="banujKorisnika('${u.id}', '${u.company_name}')" 
                                style="background:rgba(255, 0, 0, 0.1); color:#ff4d4d; border:1px solid #ff4d4d; padding:8px 15px; cursor:pointer; border-radius:4px; font-weight:bold; transition:0.3s;"
                                onmouseover="this.style.background='#ff4d4d'; this.style.color='white';"
                                onmouseout="this.style.background='rgba(255,0,0,0.1)'; this.style.color='#ff4d4d';">
                            <i class="fas fa-ban"></i> BANUJ
                        </button>
                    </td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>`;
}

// --- NOVA FUNKCIJA: BANUJ KORISNIKA (BRIŠE SVE NJEGOVO) 🚫 ---
window.banujKorisnika = async function(userId, ime) {
    // 1. Sigurnosna provera
    const potvrda = prompt(`⚠️ OPREZ! ⚠️\n\nOvo će trajno obrisati korisnika "${ime}" i SVE njegove oglase, ocene i zahteve.\n\nDa potvrdite, ukucajte: BAN`);
    
    if (potvrda !== "BAN") {
        prikaziAlert("OTKAZANO", "Banovanje je otkazano.");
        return;
    }

    // Prikaz da se nešto dešava
    const btn = event.target;
    const oldText = btn.innerHTML;
    btn.innerHTML = "BRISANJE...";
    btn.disabled = true;

    try {
        // 2. Brišemo redom (zbog povezanosti tabela)
        
        // A) Obriši oglase
        await sb.from('listings').delete().eq('user_id', userId);
        
        // B) Obriši zahteve za servis
        await sb.from('service_requests').delete().eq('user_id', userId);
        
        // C) Obriši zahteve za otkup (ako su vezani user_id-jem, ako ne, preskoči)
        // await sb.from('buy_requests').delete().eq('user_id', userId); 

        // D) Obriši recenzije (koje je on ostavio i koje je dobio)
        await sb.from('reviews').delete().eq('reviewer_id', userId);
        await sb.from('reviews').delete().eq('seller_id', userId);

        // E) Na kraju: Obriši PROFIL (Ovo ga "ubija" na sajtu)
        const { error } = await sb.from('profiles').delete().eq('id', userId);

        if (error) throw error;

        prikaziAlert("USPEH", `Korisnik ${ime} je uspešno uklonjen sa platforme.`);
        ucitajKorisnike(); // Osveži listu

    } catch (err) {
        console.error(err);
        prikaziAlert("GREŠKA", "Došlo je do greške pri brisanju: " + err.message);
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
}
// --- 2. UČITAVANJE SVIH OGLASA ---
// --- 2. UČITAVANJE SVIH OGLASA (SA BROJAČEM) ---
// Globalne promenljive za Admin Paginaciju

// 1. GLAVNA FUNKCIJA (Poziva se kad uđeš na Admin stranu)
// 1. GLAVNA FUNKCIJA (Poziva se kad uđeš na Admin stranu)
window.ucitajSveOglaseAdmin = async function(reset = true) {
    const container = document.getElementById('listings-list-container');
    const searchInput = document.getElementById('admin-search');
    
    if(!container) return;

    // Resetovanje pri novoj pretrazi ili prvom ulasku
    if(reset) {
        adminOffset = 0;
        container.innerHTML = '';
        
        // Ubacujemo Header (Stats + Search) ako ne postoji
        if(!document.getElementById('admin-stats-header')) {
            renderAdminHeader(container);
        } else {
            // Ako header postoji, samo čistimo grid za oglase
            const grid = document.getElementById('admin-listings-grid');
            if(grid) grid.innerHTML = '<p style="color:#888; text-align:center;">Učitavanje...</p>';
        }
    }

    // Čitanje pretrage
    if(searchInput) adminSearchTerm = searchInput.value.trim();

    // --- A) STATISTIKA (Izvodi se samo pri resetu/prvom loadu) ---
    if(reset) {
        // 1. Broj Oglasa (Brzi count)
        const { count } = await sb.from('listings').select('*', { count: 'exact', head: true });
        const countDisplay = document.getElementById('admin-total-count');
        if(countDisplay) countDisplay.innerText = count || 0;

        // 2. 🔥 UKUPNA VREDNOST ROBE (Tvoja želja!) 🔥
        // Trik: Povlačimo SAMO kolonu 'price' da ne gušimo bazu
        const { data: cene } = await sb.from('listings').select('price');
        
        if(cene) {
            const totalEur = cene.reduce((acc, item) => acc + (item.price || 0), 0);
            const valueDisplay = document.getElementById('admin-total-value');
            // Formatiramo broj da izgleda lepo (npr. 54.320 €)
            if(valueDisplay) valueDisplay.innerText = totalEur.toLocaleString('de-DE') + " €";
        }
    }

    // --- B) UČITAVANJE LISTE (Paginacija + Pretraga) ---
    let query = sb.from('listings')
        .select('*')
        .order('created_at', { ascending: false })
        .range(adminOffset, adminOffset + ADMIN_LIMIT - 1);

    // Ako se traži nešto specifično
    if(adminSearchTerm) {
        query = query.ilike('title', `%${adminSearchTerm}%`);
    }

    const { data: oglasi, error } = await query;
    
    // Priprema Grida
    let grid = document.getElementById('admin-listings-grid');
    if(!grid) {
        // Ako je grid obrisan loading porukom, vrati ga
        const statsHeader = document.getElementById('admin-stats-header');
        statsHeader.insertAdjacentHTML('afterend', `<div id="admin-listings-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap:15px;"></div>`);
        grid = document.getElementById('admin-listings-grid');
        
        // Vrati dugme "Učitaj još" ispod grida
        container.insertAdjacentHTML('beforeend', `
            <div style="text-align:center; margin:20px 0;">
                <button id="admin-load-more" onclick="ucitajSveOglaseAdmin(false)" class="cta-button-outline">UČITAJ JOŠ</button>
            </div>
        `);
    } else if (reset) {
        grid.innerHTML = ""; // Očisti grid ako je nova pretraga
    }

    if(error) { console.error(error); return; }

    // Ako nema rezultata
    if(oglasi.length === 0 && reset) {
        grid.innerHTML = "<p style='grid-column: 1/-1; text-align:center; color:#666;'>Nema rezultata.</p>";
        const btn = document.getElementById('admin-load-more');
        if(btn) btn.style.display = 'none';
        return;
    }

    // --- C) RENDEROVANJE KARTICA ---
    const htmlOglasa = oglasi.map(o => `
        <div style="background:#111; border:1px solid #333; padding:10px; border-radius:5px; position:relative;">
            <img src="${o.images && o.images[0] ? o.images[0] : 'assets/img/neon-logo1.png'}" style="width:100%; height:150px; object-fit:cover; border-radius:4px;">
            <h4 style="margin:10px 0; color:#fff; font-size:0.9rem;">${o.title}</h4>
            <p style="font-size:0.8rem; color:#888;">👤 ${o.seller_name}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                <span style="color:var(--accent); font-weight:bold;">${o.price} €</span>
                <button onclick="adminObrisiOglas('${o.id}')" style="background:rgba(255,0,0,0.2); color:#ff4d4d; border:1px solid #ff4d4d; padding:5px 10px; cursor:pointer; border-radius:4px; font-size:0.8rem;">OBRIŠI</button>
            </div>
        </div>
    `).join('');

    grid.innerHTML += htmlOglasa;

    // Kontrola dugmeta "Učitaj još"
    const btn = document.getElementById('admin-load-more');
    if(btn) {
        btn.style.display = (oglasi.length < ADMIN_LIMIT) ? 'none' : 'inline-block';
    }

    // Pomeri offset za sledeći put
    adminOffset += ADMIN_LIMIT;
}

function renderAdminHeader(container) {
    container.innerHTML = `
    <div id="admin-stats-header" style="margin-bottom:20px;">
        
        <div style="display:flex; gap:15px; margin-bottom:20px; flex-wrap:wrap;">
            
            <div style="background:#111; border:1px solid #333; padding:15px; border-radius:8px; text-align:center; flex:1;">
                <h3 style="margin:0; color:#888; font-size:0.8rem; text-transform:uppercase;">Ukupno Oglasa</h3>
                <div id="admin-total-count" style="font-size:1.8rem; color:#fff; font-weight:bold; font-family:'Nulshock';">...</div>
            </div>

            <div style="background:#111; border:1px solid var(--accent); padding:15px; border-radius:8px; text-align:center; flex:1;">
                <h3 style="margin:0; color:#888; font-size:0.8rem; text-transform:uppercase;">Vrednost Robe</h3>
                <div id="admin-total-value" style="font-size:1.8rem; color:var(--accent); font-weight:bold; font-family:'Nulshock';">...</div>
            </div>

        </div>

        <div style="display:flex; gap:10px;">
            <input type="text" id="admin-search" placeholder="Traži oglas po naslovu..." 
                   style="flex:1; padding:10px; background:#0f0f0f; border:1px solid #333; color:white; border-radius:4px;">
            <button onclick="ucitajSveOglaseAdmin(true)" style="background:var(--accent); border:none; color:black; padding:0 20px; font-weight:bold; cursor:pointer; border-radius:4px;">TRAŽI</button>
        </div>
    </div>
    
    <div id="admin-listings-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap:15px;"></div>
    
    <div style="text-align:center; margin:20px 0;">
        <button id="admin-load-more" onclick="ucitajSveOglaseAdmin(false)" class="cta-button-outline">UČITAJ JOŠ</button>
    </div>
    `;
    
    // Enter key listener
    document.getElementById('admin-search').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') ucitajSveOglaseAdmin(true);
    });
}

// Funkcija za brisanje oglasa (Admin)
window.adminObrisiOglas = async function(id) {
    if(!confirm("PAŽNJA: Brišeš oglas drugog korisnika. Da li si siguran?")) return;
    await sb.from('listings').delete().eq('id', id);
    ucitajSveOglaseAdmin(); // Osveži listu
}

// --- 3. UČITAVANJE SERVISNIH ZAHTEVA (Sklapanje) ---
// --- 3. UČITAVANJE SERVISNIH ZAHTEVA (SA DUGMETOM ZA BRISANJE) 🗑️ ---
window.ucitajServisneZahteve = async function() {
    const container = document.getElementById('service-requests-list');
    if(!container) return;
    container.innerHTML = '<p style="color:#888;">Učitavanje servisa...</p>';

    const { data: zahtevi, error } = await sb
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

    if(error) { container.innerHTML = "Greška."; return; }
    if(!zahtevi || zahtevi.length === 0) { container.innerHTML = '<p>Nema aktivnih zahteva za servis.</p>'; return; }

    container.innerHTML = zahtevi.map(z => {
        let deloviLista = '';
        if(Array.isArray(z.items)) {
            deloviLista = z.items.map(i => `<li style="color:#ccc; font-size:0.9rem;">• ${i.naslov} (${i.cena}€)</li>`).join('');
        }

        let statusBoja = z.status === 'done' ? '#00ff88' : 'orange';

        return `
        <div style="background:#111; border:1px solid ${statusBoja}; padding:20px; border-radius:8px; position:relative; margin-bottom: 20px;">
            <div style="position:absolute; top:15px; right:15px; color:${statusBoja}; font-weight:bold; border:1px solid ${statusBoja}; padding:2px 8px; border-radius:4px; text-transform:uppercase;">
                ${z.status}
            </div>
            
            <h3 style="color:#fff; margin-top:0;"><i class="fas fa-tools"></i> SKLAPANJE PC-a</h3>
            
            <div style="margin: 15px 0;">
                <div style="font-size:1.4rem; color:var(--accent); font-weight:bold; letter-spacing:1px;">
                    <i class="fas fa-phone"></i> ${z.user_phone || 'NEMA BROJA'}
                </div>
                <div style="color:#888; font-size:0.9rem;">📧 ${z.user_email}</div>
            </div>
            
            <div style="background:#1a1a1a; padding:15px; border-radius:5px;">
                <strong style="color:#fff;">DELOVI ZA UGRADNJU:</strong>
                <ul style="margin:5px 0 0 15px; padding:0;">${deloviLista}</ul>
                <div style="text-align:right; margin-top:10px; border-top:1px solid #333; padding-top:5px;">
                    <small style="color:#888;">Cena delova + 50€ ruka:</small><br>
                    <span style="color:var(--accent); font-weight:bold; font-size:1.1rem;">UKUPNO: ${z.total_price} €</span>
                </div>
            </div>

            <div style="margin-top:15px; display:flex; gap:10px; flex-wrap: wrap;">
                <button onclick="azurirajStatusServisa('${z.id}', 'done')" style="background:#00ff88; color:#000; border:none; padding:8px 20px; font-weight:bold; cursor:pointer; flex: 1;">✅ REŠENO</button>
                <button onclick="azurirajStatusServisa('${z.id}', 'pending')" style="background:#333; color:white; border:1px solid #555; padding:8px 20px; cursor:pointer; flex: 1;">⏳ NA ČEKANJU</button>
                
                <button onclick="obrisiServisZahtev('${z.id}')" style="background:rgba(255, 77, 77, 0.2); border:1px solid #ff4d4d; color:#ff4d4d; padding:8px 15px; cursor:pointer; border-radius: 4px;">
                    <i class="fas fa-trash"></i> OBRIŠI
                </button>
            </div>
        </div>`;
    }).join('');
}

// NOVA FUNKCIJA ZA BRISANJE SERVISA
window.obrisiServisZahtev = async function(id) {
    if(!confirm("DA LI SI SIGURAN? Ovo trajno briše ovaj zahtev!")) return;
    
    const { error } = await sb.from('service_requests').delete().eq('id', id);
    
    if(error) {
        prikaziAlert("GREŠKA", "Brisanje nije uspelo.");
    } else {
        ucitajServisneZahteve(); // Osveži listu odmah
    }
}
window.azurirajStatusServisa = async function(id, status) {
    if(!confirm("Promeni status u " + status + "?")) return;
    await sb.from('service_requests').update({ status: status }).eq('id', id);
    ucitajServisneZahteve();
}


// --- 4. UČITAVANJE OTKUP ZAHTEVA (Tvoja postojeća logika) ---
// --- 4. UČITAVANJE OTKUP ZAHTEVA (SA DUGMETOM ZA BRISANJE) 🗑️ ---
window.ucitajOtkupZahteve = async function() {
    const container = document.getElementById('buyback-requests-list');
    if(!container) return;

    container.innerHTML = '<p style="color:#888;">Učitavanje otkupa...</p>';

    const { data: zahtevi, error } = await sb
        .from('buy_requests')
        .select('*')
        .order('created_at', { ascending: false });

    if(error) { container.innerHTML = "Greška."; return; }
    
    if(!zahtevi || zahtevi.length === 0) { 
        container.innerHTML = '<p style="color:#888;">Nema zahteva za otkup.</p>'; 
        return; 
    }

    container.innerHTML = zahtevi.map(z => {
        let statusBoja = z.status === 'approved' ? '#00ff88' : (z.status === 'rejected' ? '#ff4d4d' : 'gold');
        const slika = (z.images && z.images.length > 0) ? z.images[0] : 'assets/img/neon-logo1.png';

        return `
        <div style="background:#111; border:1px solid ${statusBoja}; padding:20px; border-radius:8px; display:flex; gap:15px; flex-wrap:wrap; margin-bottom: 20px;">
            <div style="width:100px; height:100px; flex-shrink:0;">
                <img src="${slika}" style="width:100%; height:100%; object-fit:cover; border-radius:4px; border:1px solid #333;" onclick="window.open(this.src)">
            </div>
            <div style="flex:1; min-width:200px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <h3 style="color:#fff; margin:0; font-family:'Nulshock';">${z.item_name}</h3>
                    <span style="color:${statusBoja}; font-weight:bold; text-transform:uppercase;">${z.status}</span>
                </div>
                <div style="color:var(--accent); font-weight:bold; font-size:1.1rem; margin-bottom:10px;">
                    Traži: ${z.expected_price} €
                </div>
                <div style="background:#1a1a1a; padding:10px; border-radius:4px; font-size:0.9rem; margin-bottom:10px;">
                    <i class="fas fa-user"></i> ${z.full_name || 'Nepoznato'}<br>
                    <i class="fas fa-phone"></i> <a href="tel:${z.phone}" style="color:#fff;">${z.phone}</a>
                </div>
                <p style="color:#888; font-style:italic; font-size:0.9rem;">"${z.description}"</p>
            </div>
            <div style="display:flex; flex-direction:column; gap:5px; justify-content:center;">
                <button onclick="promeniStatusOtkupa('${z.id}', 'approved')" style="background:#00ff88; color:#000; border:none; padding:8px; cursor:pointer; font-weight:bold; border-radius:4px;">PRIHVATI</button>
                <button onclick="promeniStatusOtkupa('${z.id}', 'rejected')" style="background:transparent; border:1px solid #ff4d4d; color:#ff4d4d; padding:8px; cursor:pointer; border-radius:4px;">ODBIJ</button>
                
                <button onclick="obrisiOtkupZahtev('${z.id}')" style="background:#222; border:1px solid #666; color:#aaa; padding:8px; cursor:pointer; border-radius:4px; margin-top: 10px;">
                    <i class="fas fa-trash"></i> OBRIŠI
                </button>
            </div>
        </div>`;
    }).join('');
}

// NOVA FUNKCIJA ZA BRISANJE OTKUPA
window.obrisiOtkupZahtev = async function(id) {
    if(!confirm("Trajno obriši ovaj zahtev?")) return;
    
    const { error } = await sb.from('buy_requests').delete().eq('id', id);
    
    if(error) {
        prikaziAlert("GREŠKA", "Nije uspelo.");
    } else {
        ucitajOtkupZahteve(); // Osveži listu odmah
    }
}

window.promeniStatusOtkupa = async function(id, status) {
    if(!confirm("Promeni status u " + status + "?")) return;
    await sb.from('buy_requests').update({ status: status }).eq('id', id);
    ucitajOtkupZahteve();
}

// ==========================================
// 🧠 PROVERA KOMPATIBILNOSTI (GEEKBIT ANALYZER - V4 sa RETRO DETEKCIJOM)
// ==========================================
window.proveriKompatibilnost = function() {
    const korpa = JSON.parse(localStorage.getItem('geekbit_korpa')) || [];
    if(korpa.length === 0) { prikaziAlert("GREŠKA", "Korpa je prazna!"); return; }

    let cpu = null; let maticna = null; let ram = null;
    let gpu = null; let napajanje = null; let kuciste = null;

 // 1. Ekstrakcija podataka (BLINDIRANO)
    korpa.forEach(item => {
        const tekst = (item.naslov + " " + (item.opis || "")).toUpperCase();
        
        // Cistimo kategoriju od razmaka i forsiraćemo mala slova da uvek gađamo tačno!
        const kat = (item.kategorija || "").toLowerCase().trim();
        
        if (kat === 'cpu') {
            const stats = analizirajCPU(tekst);
            cpu = { naziv: item.naslov, socket: detektujSocket(tekst), tdp: stats.tdp, score: stats.score, isLegacy: stats.isLegacy };
        }
        else if (kat === 'maticna') {
            maticna = { naziv: item.naslov, socket: detektujSocket(tekst), ramTip: detektujRam(tekst), velicina: detektujFormat(tekst) };
        }
        else if (kat === 'ram') {
            ram = { naziv: item.naslov, tip: detektujRam(tekst) };
        }
        else if (kat === 'gpu') {
            const stats = analizirajGPU(tekst);
            gpu = { naziv: item.naslov, minPsu: stats.minPsu, tdp: stats.tdp, score: stats.score, duzina: detektujDuzinuGPU(tekst), isLegacy: stats.isLegacy };
        }
        else if (kat === 'napajanje') {
            napajanje = { naziv: item.naslov, snaga: detektujSnaguNapajanja(tekst) };
        }
        else if (kat === 'kuciste') {
            kuciste = { naziv: item.naslov, maxFormat: detektujFormat(tekst), maxGpu: detektujMaxGPUKucista(tekst) };
        }
    });

    let poruke = [];

    // --- 🏆 GEEKBIT BUILD RATING & TDP KALKULATOR ---
    let summaryBox = "";
    if (cpu && gpu) {
        let ukupnaPotrosnja = cpu.tdp + gpu.tdp + 80; 
        let preporucenoNapajanje = Math.max(ukupnaPotrosnja + 150, gpu.minPsu);
        
        let naslovBuilda = "BUDGET / OFFICE BUILD";
        let bojaBedza = "#888";

        if(gpu.score >= 9.5 && cpu.score >= 8.5) { naslovBuilda = "4K ULTIMATE MONSTER"; bojaBedza = "#ff0055"; }
        else if(gpu.score >= 7.5 && cpu.score >= 6.5) { naslovBuilda = "1440p HIGH-END GAMING"; bojaBedza = "gold"; }
        else if(gpu.score >= 4.5 && cpu.score >= 4.5) { naslovBuilda = "1080p SWEET SPOT"; bojaBedza = "var(--accent)"; }
        else if(gpu.score <= 3.5 && cpu.score <= 3.5) { naslovBuilda = "ESPORTS / RETRO GAMING"; bojaBedza = "#4d94ff"; }

        let razlika = gpu.score - cpu.score;
        let bottleneckPoruka = "";
        
        if(gpu.score >= 9.5 && cpu.score <= 6) {
            naslovBuilda = "IMBALANCED HIGH-END"; 
            bojaBedza = "#ff4d4d";
            bottleneckPoruka = `<b style="color:#ff4d4d;">BOTTLENECK: PRESLAB PROCESOR!</b><br>Grafička karta je vrhunska, ali će je procesor drastično usporiti. Očekujte "seckanje" u igrama.`;
        } else if(razlika >= 3) {
            bottleneckPoruka = `<b>BOTTLENECK: SLAB PROCESOR!</b><br>Grafika neće raditi na 100% snage jer procesor ne može da je isprati.`;
        } else if (cpu.score - gpu.score >= 3.0) { // Spušteno na 3.0 da bi uhvatilo 9700 vs HD7870
            bottleneckPoruka = `<b>BOTTLENECK: SLABA GRAFIKA!</b><br>Imate odličan procesor, ali je grafička karta previše slaba za njega u modernom gejmingu.`;
        } else {
            bottleneckPoruka = `<b>BALANS:</b> Procesor i Grafička su odlično upareni!`;
        }

        summaryBox = `
        <div style="background:#0a0a0a; border:2px solid ${bojaBedza}; padding:15px; border-radius:10px; margin-bottom:20px; text-align:center;">
            <div style="font-size:0.8rem; color:#888; text-transform:uppercase; margin-bottom:5px;">GeekBit Build Ocena</div>
            <h3 style="color:${bojaBedza}; margin:0 0 15px 0; font-family:'Nulshock';">${naslovBuilda}</h3>
            <div style="display:flex; justify-content:space-around; border-top:1px solid #222; padding-top:10px;">
                <div><span style="display:block; font-size:0.75rem; color:#888;">Potrošnja (TDP)</span><strong style="color:#fff;">~${ukupnaPotrosnja}W</strong></div>
                <div><span style="display:block; font-size:0.75rem; color:#888;">Idealan PSU</span><strong style="color:var(--accent);">${preporucenoNapajanje}W+</strong></div>
            </div>
        </div>`;
        poruke.push(bottleneckPoruka);
    }

    // --- ⏳ RETRO UPOZORENJA ---
    if (cpu && cpu.isLegacy) {
        poruke.unshift(`<div style="color:orange; margin-bottom: 10px;">⏳ <b>RETRO PROCESOR:</b> Prepoznali smo da je procesor star oko 10 (ili više) godina. Ne očekujte dobre performanse u modernim igrama.</div>`);
    }
    if (gpu && gpu.isLegacy) {
        poruke.unshift(`<div style="color:orange; margin-bottom: 10px;">⏳ <b>RETRO GRAFIKA:</b> Ova grafička karta spada u stariju generaciju. Pogodna je samo za sliku, stare igrice ili nezahtevne eSports naslove.</div>`);
    }

    // --- 🛠️ MEGA DETALJNE FIZIČKE PROVERE ---
    if (cpu && maticna) {
        if (!cpu.socket || !maticna.socket) {
            poruke.push(`⚠️ <b>PROCESOR I PLOČA:</b> Nismo uspeli da prepoznamo socket. Obavezno proverite specifikacije ručno!`);
        } else if (cpu.socket !== maticna.socket) {
            poruke.push(`<b style="color:#ff4d4d;">❌ NEKOMPATIBILAN SOCKET!</b> CPU zahteva <b>${cpu.socket}</b>, a ploča je <b>${maticna.socket}</b>. Ovo fizički ne može da se spoji.`);
        } else {
            poruke.push(`<b>PROCESOR I PLOČA:</b> Kompatibilno (Socket ${cpu.socket}).`);
        }
    }

    if (ram && maticna) {
        if (ram.tip && maticna.ramTip && ram.tip !== maticna.ramTip) {
            poruke.push(`<b style="color:#ff4d4d;">❌ POGREŠAN RAM!</b> Tvoja ploča podržava <b>${maticna.ramTip}</b>, a memorija koju si izabrao je <b>${ram.tip}</b>. Utori se fizički razlikuju.`);
        } else if (ram.tip && maticna.ramTip) {
            poruke.push(`<b>RAM MEMORIJA:</b> Kompatibilno (${ram.tip}).`);
        }
    }

    if (maticna && kuciste) {
        if (maticna.velicina > kuciste.maxFormat) {
            const formati = ["Mini-ITX", "Micro-ATX", "ATX", "E-ATX"];
            poruke.push(`<b style="color:#ff4d4d;">❌ PLOČA NE STAJE U KUĆIŠTE!</b> Matična ploča je ${formati[maticna.velicina]}, a kućište prima maksimalno ${formati[kuciste.maxFormat]}.`);
        } else if (maticna.velicina !== -1 && kuciste.maxFormat !== -1) {
            poruke.push(`<b>VELIČINA PLOČE:</b> Matična ploča staje u kućište.`);
        }
    }

    if (gpu && kuciste) {
        if (gpu.duzina > 0 && kuciste.maxGpu > 0) {
            if (gpu.duzina > kuciste.maxGpu) {
                poruke.push(`<b style="color:#ff4d4d;">❌ GRAFIČKA JE PREDUGAČKA!</b> Grafika je dugačka ~${gpu.duzina}mm, a u kućište staje max ${kuciste.maxGpu}mm. Udariće u prednje ventilatore.`);
            } else if ((kuciste.maxGpu - gpu.duzina) < 15) {
                poruke.push(`⚠️ <b>GRAFIČKA JEDVA STAJE:</b> Grafika (~${gpu.duzina}mm) će ući u kućište (max ${kuciste.maxGpu}mm), ali će biti jako tesno za hlađenje.`);
            } else {
                poruke.push(`<b>GRAFIČKA I KUĆIŠTE:</b> Ima dovoljno mesta za grafiku (~${gpu.duzina}mm).`);
            }
        }
    }

    if (gpu && napajanje) {
        let reqPsu = gpu.minPsu;
        if (cpu) reqPsu = Math.max(reqPsu, cpu.tdp + gpu.tdp + 150);

        if (napajanje.snaga > 0 && napajanje.snaga < reqPsu) {
            poruke.push(`<b style="color:#ff4d4d;">❌ SLABO NAPAJANJE!</b> Ovaj sistem zahteva napajanje od najmanje <b>${reqPsu}W</b>, tvoje je <b>${napajanje.snaga}W</b>.`);
        } else if (napajanje.snaga > 0) {
            poruke.push(`<b>NAPAJANJE:</b> ${napajanje.snaga}W je dovoljno za ovaj sistem.`);
        }
    }

    const finalHTML = summaryBox + poruke.join('<br><hr style="border-color:#222; margin:10px 0;">');
    prikaziAlert("REZULTAT PROVERE", finalHTML || "Dodajte komponente u korpu za detaljnu analizu.");
}

// ==========================================
// 🧠 PROŠIRENA BAZA ZA CPU
// ==========================================
function analizirajCPU(tekst) {
    let tdp = 65; let score = 2.0; let isLegacy = false; 
    
    // TIER 10: Enthusiast/Workstation
    if (tekst.match(/14900|13900|7950X|9950X|9900X|7900X|14700|7800X3D|9800X3D|285K|265K/)) { tdp = 180; score = 10; }
    // TIER 8.5: High-End
    else if (tekst.match(/12900|12700|13700|13600|14600|7700|7600X|5800X3D|5950X|5900X/)) { tdp = 125; score = 8.5; }
    // TIER 6.5: Mid-Range (Dodat 5500, 5700, 7500F itd.)
    else if (tekst.match(/12400|13400|5600X|5600|5500|5700|7500|3700X|11700|10700|11900|7600/)) { tdp = 65; score = 6.5; }
    // TIER 5: Vintage High-End & Stariji Mid-Range
    else if (tekst.match(/9900|9700|8700|3600|2700|10600|9600|10400|11400/)) { tdp = 95; score = 5.0; }
    // TIER 3.5: Budget (DDR4 era)
    else if (tekst.match(/I3|RYZEN 3|10100|12100|13100|G6400|8100|9100|7700K|6700K|7500|6500|4500|4600/)) { tdp = 65; score = 3.5; }
    // TIER 2.5: Zastarelo (DDR3 era - i7 4. i 3. gen, jači FX)
    else if (tekst.match(/4790|4770|3770|2600|4690|3570|FX 8350|FX 8320/)) { tdp = 95; score = 2.5; isLegacy = true; }
    // TIER 1.5: Prastaro
    else if (tekst.match(/CORE 2|QUAD|PHENOM|ATHLON|FX 6|FX 4|PENTIUM|CELERON/)) { tdp = 95; score = 1.5; isLegacy = true; }
    else { isLegacy = true; } 
    
    return { tdp, score, isLegacy };
}

function analizirajGPU(tekst) {
    let tdp = 120; let minPsu = 450; let score = 2.0; let isLegacy = false;
    
    // TIER 10: God Tier
    if(tekst.match(/5090|4090|5080/)) { tdp = 450; minPsu = 1000; score = 10; }
    // TIER 9.5: Enthusiast
    else if(tekst.match(/4080|3090|7900 XTX|5070 TI|5070/)) { tdp = 350; minPsu = 850; score = 9.5; }
    // TIER 8: High-End
    else if(tekst.match(/4070|3080|7800 XT|6950 XT|6900 XT|RX 6800/)) { tdp = 285; minPsu = 750; score = 8.0; }
    // TIER 6: Mid-Range
    else if(tekst.match(/4060|3060|6750 XT|6700 XT|6600 XT|7600|7700 XT|2080|2070|2060 SUPER/)) { tdp = 180; minPsu = 600; score = 6.0; }
    // TIER 4.5: Entry-level modern
    else if(tekst.match(/1660|1080|1070|2060|6600|6500 XT|ARC A770|ARC A750/)) { tdp = 130; minPsu = 500; score = 4.5; }
    // TIER 3.5: Older budget (Dobar za eSport)
    else if(tekst.match(/1060|1650|1050|980|970|RX 580|RX 570|RX 480|RX 470|R9 390|R9 290/)) { tdp = 150; minPsu = 500; score = 3.5; }
    // TIER 2: Legacy (Slabo za današnje standarde)
    else if(tekst.match(/960|950|780|770|760|750 TI|1030|HD 7970|HD 7950|HD 7870|HD 7850|R9 280|R9 270|RX 560|RX 460/)) { tdp = 150; minPsu = 450; score = 2.0; isLegacy = true; }
    // TIER 1: Prastaro (HD 6000, GT serije)
    else if(tekst.match(/GT 730|GT 710|HD 6|HD 5|R7 2|R7 3/)) { tdp = 60; minPsu = 300; score = 1.0; isLegacy = true; }
    else { isLegacy = true; }
    
    return { tdp, minPsu, score, isLegacy };
}

// ==========================================
// 🔌 PAMETNA DETEKCIJA SOCKETA (Sa zaštitom od Intel/AMD duplikata)
// ==========================================
function detektujSocket(tekst) {
    // 1. PRVO REŠAVAMO MATIČNE PLOČE (Tu nema duplikata)
    if (tekst.match(/LGA1851|Z890|B860/)) return "LGA1851";
    if (tekst.match(/LGA1700|Z790|B760|Z690|B660|H610/)) return "LGA1700";
    if (tekst.match(/LGA1200|Z590|B560|Z490|B460|H410/)) return "LGA1200";
    if (tekst.match(/Z390|Z370|B365|B360|H310/)) return "LGA1151 v2 (8/9 Gen)";
    if (tekst.match(/Z270|Z170|B250|B150|H110/)) return "LGA1151 v1 (6/7 Gen)";
    if (tekst.match(/LGA1150|Z97|H97|B85/)) return "LGA1150";
    
    if (tekst.match(/AM5|X670|X870|B650|A620/)) return "AM5";
    if (tekst.match(/AM4|X570|B550|B450|X470|B350|A320/)) return "AM4";
    if (tekst.match(/AM3|990FX/)) return "AM3+";

    // 2. DETEKTUJEMO MARKU PROCESORA KAKO NE BI POMEŠALI 7700 Intel i 7700 AMD
    const isRyzen = tekst.match(/RYZEN|R3|R5|R7|R9|THREADRIPPER/);
    const isIntel = tekst.match(/INTEL|CORE|I3|I5|I7|I9|PENTIUM|CELERON/);

    // 3A. AKO JE 100% AMD:
    if (isRyzen) {
        if (tekst.match(/9950|9900|9700|9600|8700|8600|8500|7950|7900|7800|7700|7600|7500/)) return "AM5";
        if (tekst.match(/5950|5900|5800|5700|5600|5500|4600|4500|4300|3950|3900|3800|3700|3600|3500|3300|3100|2700|2600|1600/)) return "AM4";
    }
    
    // 3B. AKO JE 100% INTEL:
    if (isIntel) {
        if (tekst.match(/285K|265K|245K/)) return "LGA1851";
        if (tekst.match(/14900|14700|14600|14400|13900|13700|13600|13400|13100|12900|12700|12600|12400|12100/)) return "LGA1700";
        if (tekst.match(/11900|11700|11600|11400|10900|10700|10600|10400|10100/)) return "LGA1200";
        if (tekst.match(/9900|9700|9600|9400|9100|8700|8600|8400|8100/)) return "LGA1151 v2 (8/9 Gen)";
        if (tekst.match(/7700|7600|7500|7400|7100|6700|6600|6500|6400|6100/)) return "LGA1151 v1 (6/7 Gen)";
        if (tekst.match(/4790|4770|4690|4670|4590|4460|4130/)) return "LGA1150";
    }

    // 4. FALLBACK: AKO JE KORISNIK LENJ PA NIJE NIKAKO NAPISAO MARKU (Samo ukucao npr. "7700x")
    if (tekst.match(/7950X|7900X|7800X3D|7700X|7600X|7500F/)) return "AM5"; // X i F sufiksi su obično AMD
    if (tekst.match(/5950X|5900X|5800X|5700X|5600X/)) return "AM4";
    if (tekst.match(/7700K|7600K|6700K|6600K/)) return "LGA1151 v1 (6/7 Gen)"; // K sufiks za stare Intele
    if (tekst.match(/9900K|9700K|9600K|8700K|8600K/)) return "LGA1151 v2 (8/9 Gen)";

    // Ako ukuca samo broj "7700" a ne napiše ni Intel ni Ryzen, pošto je Ryzen aktuelniji danas:
    if (tekst.match(/7700|7600/)) return "AM5"; 
    
    return null;
}

function detektujRam(tekst) {
    if (tekst.match(/DDR5|6000MHZ|6400MHZ|7200MHZ/)) return "DDR5";
    if (tekst.match(/DDR4|3200MHZ|3600MHZ|3000MHZ/)) return "DDR4";
    if (tekst.match(/DDR3|1600MHZ|1333MHZ/)) return "DDR3";
    
    // Pametno pogađanje na osnovu ploče/CPU ako ne piše direktno RAM
    if (tekst.match(/AM5|LGA1851|Z890|Z790/)) return "DDR5";
    if (tekst.match(/AM4|Z490|B450|Z390/)) return "DDR4";
    if (tekst.match(/AM3|LGA1150/)) return "DDR3";
    
    return null;
}

function detektujSnaguNapajanja(tekst) {
    const match = tekst.match(/(\d{3,4})\s*[Ww]/);
    if (match) return parseInt(match[1]); 
    return 0;
}

// 0: Mini-ITX, 1: Micro-ATX, 2: ATX, 3: E-ATX
function detektujFormat(tekst) {
    if (tekst.match(/E-ATX|EATX|FULL TOWER|BIG TOWER/)) return 3;
    if (tekst.match(/ATX|MID TOWER|MIDI TOWER/)) return 2;
    if (tekst.match(/MICRO-ATX|MICRO ATX|MATX|MINI TOWER/)) return 1;
    if (tekst.match(/MINI-ITX|MINI ITX|ITX|SFF/)) return 0;
    return -1; // Nepoznato
}

function detektujDuzinuGPU(tekst) {
    // 1. Ako je prodavac eksplicitno napisao dužinu
    const match = tekst.match(/(\d{3})\s*mm/i);
    if (match && parseInt(match[1]) > 150) return parseInt(match[1]);
    
    // 2. Ako nije, pogađamo prosek na osnovu modela čipa i hlađenja
    const isTrio = tekst.match(/TRIO|SUPRIM|AORUS|ROG STRIX|3 VENTILATORA|3 FAN/);
    if (tekst.match(/5090|4090|4080|3090/)) return 340; 
    if (tekst.match(/7900 XTX|6950 XT/)) return 330;
    if (tekst.match(/4070 TI|3080/)) return isTrio ? 320 : 290;
    if (tekst.match(/4060|3060|6600|7600/)) return isTrio ? 280 : 240;
    if (tekst.match(/ITX|MINI/)) return 170;
    
    return 0; 
}

function detektujMaxGPUKucista(tekst) {
    // Ako piše "max GPU 340mm"
    const match = tekst.match(/(?:DO|MAX|MAKSIMALNO|GPU KLIRENS)[\s\w:]*?(\d{3})\s*mm/i);
    if (match) return parseInt(match[1]);

    // Ako je poznat format kućišta, pretpostavljamo prosek industrije
    if (tekst.match(/FULL TOWER|BIG TOWER|E-ATX/)) return 400; 
    if (tekst.match(/MID TOWER|MIDI TOWER/)) return 340;
    if (tekst.match(/MINI TOWER|MATX/)) return 310;
    if (tekst.match(/ITX|SFF/)) return 250;
    
    return 0; 
}
// ==========================================
// 15. SISTEM OCENJIVANJA I KOMENTARA (KOMPLET) ⭐💬
// ==========================================

// 1. ZATVARANJE IZLOGA
window.zatvoriIzlog = function() {
    const izlog = document.getElementById('seller-storefront');
    if(izlog) {
        izlog.style.display = 'none';
        // Sakrij komentare kad izađeš, da sledeći put bude uredno
        const lista = document.getElementById('store-reviews-list');
        if(lista) lista.style.display = 'none';
    }
    
    sessionStorage.removeItem('open_seller');
    
    const loadMoreBtn = document.getElementById('load-more-btn');
    if(loadMoreBtn) loadMoreBtn.style.display = 'inline-block';

    if(typeof ucitajNajnovijeOglase === 'function') {
        ucitajNajnovijeOglase();
    }
}

// 2. OTVARANJE MODALA ZA OCENU (SA ZAKLJUČAVANJEM 🔒)
window.otvoriReviewModal = async function() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
        prikaziAlert("PAŽNJA", "Prijavite se da biste ocenili prodavca.");
        return;
    }
    
    const storedSeller = sessionStorage.getItem('open_seller');
    if(!storedSeller) return;
    const seller = JSON.parse(storedSeller);
    
    if(seller.prodavacId === user.id) {
        prikaziAlert("GREŠKA", "Ne možete oceniti sami sebe!");
        return;
    }

    // 🛑 NOVA PROVERA U BAZI: Da li je transakcija završena?
    const { data: transakcije } = await sb.from('transactions')
        .select('*')
        .eq('seller_id', seller.prodavacId)
        .eq('buyer_id', user.id)
        .eq('status', 'completed');

    if(!transakcije || transakcije.length === 0) {
        prikaziAlert("ZABRANJENO 🚫", "Možete oceniti samo prodavce od kojih ste uspešno kupili predmet preko sajta (i koji su to potvrdili).");
        return;
    }

    window.trenutniProdavacIdZaReview = seller.prodavacId;
    
    const modal = document.getElementById('review-modal');
    if(modal) {
        modal.style.display = 'flex';
        resetStars();
    }
}





window.ucitajOceneProdavca = async function(sellerId) {
    console.log("🔍 Učitavam ocene za prodavca:", sellerId);
    
    // Tražimo kolonu 'rating' za određenog prodavca
    const { data: reviews, error } = await sb.from('reviews')
        .select('rating')
        .eq('seller_id', sellerId);
    
    if (error) {
        console.error("❌ Greška pri čitanju ocena:", error.message);
        return;
    }

    console.log("⭐ Pronađeno ocena u bazi:", reviews.length);

    const avgElem = document.getElementById('store-avg-rating');
    const countElem = document.getElementById('store-rating-count');
    
    if (!reviews || reviews.length === 0) {
        if(avgElem) avgElem.innerText = "0.0";
        if(countElem) countElem.innerText = "0";
        return;
    }

    // Računanje proseka
    const count = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const prosek = (sum / count).toFixed(1);

    // Upisivanje u HTML
    if(avgElem) avgElem.innerText = prosek;
    if(countElem) countElem.innerText = count;
}

// 6. 🔥 NOVO: PRIKAZIVANJE KOMENTARA 🔥
window.toggleKomentare = function() {
    const lista = document.getElementById('store-reviews-list');
    const storedSeller = sessionStorage.getItem('open_seller');
    
    if(!lista || !storedSeller) return;
    
    // Ako je već otvoren, zatvori ga
    if(lista.style.display === 'block') {
        lista.style.display = 'none';
        return;
    }
    
    // Inače otvori i učitaj
    lista.style.display = 'block';
    const seller = JSON.parse(storedSeller);
    ucitajKomentareProdavca(seller.prodavacId);
}

window.ucitajKomentareProdavca = async function(sellerId) {
    const container = document.getElementById('store-reviews-list');
    container.innerHTML = '<p style="color:#888; text-align:center;">Učitavanje...</p>';

    const { data: reviews, error } = await sb
        .from('reviews')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

    if(error) {
        container.innerHTML = '<p style="color:red;">Greška pri učitavanju.</p>';
        return;
    }

    if(reviews.length === 0) {
        container.innerHTML = '<p style="color:#666; text-align:center; padding:10px;">Još uvek nema utisaka.</p>';
        return;
    }

    // Crtanje komentara
    container.innerHTML = reviews.map(r => {
        // Pravimo zvezdice za prikaz
        let starsHtml = '';
        for(let i=1; i<=5; i++) {
            starsHtml += `<i class="fas fa-star" style="color: ${i <= r.rating ? 'gold' : '#333'}; font-size:0.8rem;"></i>`;
        }

        return `
        <div style="border-bottom: 1px solid #333; padding: 10px 0; margin-bottom: 5px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:var(--accent); font-size:0.9rem;">${r.reviewer_name || 'Korisnik'}</strong>
                <div>${starsHtml}</div>
            </div>
            <p style="color:#ddd; font-size:0.9rem; margin-top:5px; font-style: italic;">"${r.comment}"</p>
            <small style="color:#666; font-size:0.7rem;">${new Date(r.created_at).toLocaleDateString()}</small>
        </div>
        `;
    }).join('');
}


// ==========================================
// 16. SMART ALERTS (KOMPLETAN SISTEM) 🔔
// ==========================================

// 1. ČUVANJE PRETRAGE (Klik na zvonce) - OVO TI JE FALILO
window.sacuvajPretragu = async function() {
    const input = document.getElementById('search-input');
    const term = input.value.trim();

    // Provera da li je polje prazno
    if(!term) {
        prikaziAlert("GREŠKA", "Upišite nešto u pretragu pre čuvanja.");
        return;
    }

    // Provera da li je korisnik ulogovan
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
        prikaziAlert("PAŽNJA", "Morate biti prijavljeni da biste pratili pretrage.");
        prijaviSeGoogle();
        return;
    }

    // Provera da li već prati taj pojam
    const { data: existing } = await sb.from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .eq('search_term', term);

    if(existing && existing.length > 0) {
        prikaziAlert("OBAVEŠTENJE", "Već pratite pretragu za: <b>" + term + "</b>");
        return;
    }

    // Upis u bazu
    const { error } = await sb.from('saved_searches').insert({
        user_id: user.id,
        search_term: term
    });

    if(error) {
        prikaziAlert("GREŠKA", error.message);
    } else {
        prikaziAlert("USPEH", "Uspešno sačuvano! 🔔<br>Javićemo vam kad se pojavi <b>" + term + "</b>.");
    }
}

// 2. AUTOMATSKA PROVERA (Pokreće se kad uđeš na sajt)
window.proveriAlerte = async function() {
    // Provera sesije: Ako je već video obaveštenje, ne prikazuj opet dok ne restartuje browser
    if (sessionStorage.getItem('alert_seen_session')) return;

    const { data: { user } } = await sb.auth.getUser();
    if (!user) return; 

    // Uzmi šta korisnik prati
    const { data: searches } = await sb.from('saved_searches').select('search_term').eq('user_id', user.id);
    if(!searches || searches.length === 0) return;

    // Sačekaj malo da se proizvodi učitaju
    setTimeout(() => {
        if(typeof proizvodi === 'undefined' || proizvodi.length === 0) return;

        let pronadjeno = 0;
        let matchTerm = "";

        searches.forEach(s => {
            const term = s.search_term.toLowerCase();
            const count = proizvodi.filter(p => p.naslov.toLowerCase().includes(term)).length;
            
            if(count > 0) {
                pronadjeno += count;
                matchTerm = s.search_term;
            }
        });

        if(pronadjeno > 0) {
            // Prikazujemo suptilni Toast
            prikaziToast(pronadjeno, matchTerm);
            
            // Pamtimo da je video
            sessionStorage.setItem('alert_seen_session', 'true');
        }
    }, 2000); 
}

// 3. ELEGANTNO OBAVEŠTENJE (TOAST) 🍞
function prikaziToast(broj, pojam) {
    const toast = document.createElement('div');
    
    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.right = '-400px'; 
    toast.style.backgroundColor = '#111';
    toast.style.borderLeft = '4px solid #00ff88'; 
    toast.style.color = '#fff';
    toast.style.padding = '20px 25px';
    toast.style.borderRadius = '4px';
    toast.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.2)';
    toast.style.zIndex = '99999';
    toast.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
    toast.style.fontFamily = "'Roboto', sans-serif";
    toast.style.maxWidth = '350px';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '15px';

    toast.innerHTML = `
        <div style="background: rgba(0,255,136,0.1); width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            <i class="fas fa-bell" style="color: #00ff88; font-size: 1.2rem;"></i>
        </div>
        <div>
            <h4 style="margin:0; font-family:'Nulshock'; color:#00ff88; font-size:0.9rem;">SMART ALERT</h4>
            <p style="margin:5px 0 0 0; font-size:0.85rem; color:#ccc;">
                Pronašli smo <b>${broj}</b> novih oglasa za <b>"${pojam}"</b>.
            </p>
        </div>
        <span style="position:absolute; top:5px; right:10px; cursor:pointer; color:#666;" onclick="this.parentElement.style.right='-400px'">&times;</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.right = '30px'; 
    }, 100);

    setTimeout(() => {
        toast.style.right = '-400px'; 
        setTimeout(() => {
            toast.remove(); 
        }, 500);
    }, 6000);
}

// ==========================================
// 17. AUTH UI & ZAKLJUČAVANJE IMENA (FIX) 🔒
// ==========================================

// 1. Funkcija koja proverava i zaključava ime u formi
async function proveriZakljucanoIme(user) {
    const inputIme = document.getElementById('ime-prodavca');
    
    // Ako nismo na stranici gde je forma, prekini
    if (!inputIme) return; 

    // Povuci podatke iz profila
    const { data: profile } = await sb
        .from('profiles')
        .select('company_name')
        .eq('id', user.id)
        .single();

    // Ako postoji ime u bazi, upiši ga i ZAKLJUČAJ polje
    if (profile && profile.company_name) {
        inputIme.value = profile.company_name;
        inputIme.disabled = true; // 🚫 Onemogući kucanje
        
        // Vizuelni efekat da se vidi da je zaključano
        inputIme.style.backgroundColor = "rgba(0, 255, 136, 0.05)"; 
        inputIme.style.border = "1px solid var(--accent)";
        inputIme.style.color = "#aaa";
        inputIme.style.cursor = "not-allowed";
        inputIme.title = "Ime je verifikovano i vezano za vaš nalog.";

        // Dodajemo katanac ikonicu pored labele (ako već nije tu)
        const label = inputIme.previousElementSibling;
        if(label && !label.innerHTML.includes('fa-lock')) {
            label.innerHTML += ' <i class="fas fa-lock" style="color:gold; font-size:0.9rem; margin-left:5px;" title="Identitet potvrđen"></i>';
        }
    }
}

// 2. Glavna funkcija za osvežavanje menija (Login/Logout/Admin)
window.updateAuthUI = function(session) {
    const user = session?.user;
    
    const loginBtn = document.getElementById('login-btn');
    const profileBtn = document.getElementById('user-profile-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const myAdsBtn = document.getElementById('my-ads-btn');
    const userName = document.getElementById('user-name');
    const adminBtn = document.getElementById('admin-btn'); 

    if(loginBtn) loginBtn.style.display = 'inline-block';
    if(profileBtn) profileBtn.style.display = 'none';
    if(logoutBtn) logoutBtn.style.display = 'none';
    if(myAdsBtn) myAdsBtn.style.display = 'none';
    if(adminBtn) adminBtn.style.display = 'none';

    if (user) {
        if(loginBtn) loginBtn.style.display = 'none';
        
        if(profileBtn) {
            profileBtn.style.display = 'flex';
            const imePrikaz = user.user_metadata.full_name || user.email.split('@')[0];
            if(userName) userName.innerText = imePrikaz.substring(0, 15);
            
            const profilIme = document.getElementById('profile-display-name');
            const profilEmail = document.getElementById('profile-email');
            if (profilIme) profilIme.innerText = imePrikaz;
            if (profilEmail) profilEmail.innerText = user.email;
        }
        
        if(logoutBtn) logoutBtn.style.display = 'inline-block';
        if(myAdsBtn) myAdsBtn.style.display = 'inline-block';

        if (user.email === 'geekbit10@gmail.com' && adminBtn) {
            adminBtn.style.display = 'inline-block'; 
        }

        proveriZakljucanoIme(user);

        // 🔥 NOVO: KREIRANJE I PROVERA NOTIFIKACIJA ZA "MOJI OGLASI"
        const myAdsLink = document.querySelector('#my-ads-btn a');
        if(myAdsLink) {
            myAdsLink.style.position = 'relative';
            let badge = document.getElementById('ads-notif-badge');
            if(!badge) {
                badge = document.createElement('span');
                badge.id = 'ads-notif-badge';
                badge.style.cssText = 'background: #ff4d4d; color: white; border-radius: 50%; padding: 2px 6px; font-size: 0.7rem; position: absolute; top: -8px; right: -15px; display: none; font-weight: bold; box-shadow: 0 0 10px rgba(255, 77, 77, 0.5);';
                myAdsLink.appendChild(badge);
            }
            if (typeof proveriNoveZahteveZaOglase === 'function') {
                proveriNoveZahteveZaOglase(user.id);
            }
        }
    }
}

// 🔥 NOVO: FUNKCIJA KOJA BROJI NOVE ZAHTEVE
window.proveriNoveZahteveZaOglase = async function(userId) {
    const badge = document.getElementById('ads-notif-badge');
    if(!badge) return;

    // Tražimo koliko ima "pending" zahteva gde je ulogovani korisnik PRODAVAC
    const { count, error } = await sb.from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId)
        .eq('status', 'pending');

    if (count && count > 0) {
        badge.innerText = count;
        badge.style.display = 'inline-block';
        badge.style.animation = 'pulse 2s infinite'; // Dodaje mali efekat pulsiranja
    } else {
        badge.style.display = 'none';
    }
}

// ==========================================
// 18. MOBILNI MENI (BURGER FIX) 🍔
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');

    if (burger && nav) {
        burger.addEventListener('click', () => {
            // Toggle Nav
            nav.classList.toggle('nav-active');

            // Burger Animation (pretvara se u X)
            burger.classList.toggle('toggle');
        });
    }
});






// ==========================================
// 20. POPRAVKA KLIKOVA NA DUGMAD (OCENE/KOMENTARI) 🖱️
// ==========================================
// Ovo osigurava da dugmići u izlogu reaguju
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'close-review-modal') {
        document.getElementById('review-modal').style.display = 'none';
    }
});


// Funkcija koju dugme poziva
window.klikniUcitajJos = function() {
    trenutniLimit += KORAK_UCITAVANJA; // Povećaj limit za 20
    window.osveziPrikaz(); // Osveži prikaz sa novim limitom
}


// Resetuj limit kad neko kuca u pretragu
document.getElementById('search-input')?.addEventListener('input', () => {
    trenutniLimit = 20;
    window.osveziPrikaz();
});

// Resetuj limit kad se menja sortiranje
document.getElementById('sort-select')?.addEventListener('change', () => {
    trenutniLimit = 20;
    window.osveziPrikaz();
});



// ==========================================
// 21. GALERIJA - FINALNA VERZIJA (BEZ BUG-OVA) 🖼️
// ==========================================

// Koristimo 'var' da budemo sigurni da su globalne
var trenutneSlikeGalerije = [];
var trenutniIndeksSlike = 0;

window.otvoriGaleriju = function(slike, naslov) {
    const modal = document.getElementById('image-modal');
    const img = document.getElementById('modal-img');
    const caption = document.getElementById('modal-caption');

    if (!modal || !img) return;

    // 1. Resetuj i napuni niz slika
    trenutneSlikeGalerije = [];
    
    if (Array.isArray(slike) && slike.length > 0) {
        trenutneSlikeGalerije = slike;
    } else if (typeof slike === 'string' && slike.trim() !== "") {
        trenutneSlikeGalerije = [slike];
    } else {
        trenutneSlikeGalerije = ['assets/img/neon-logo1.png'];
    }

    // DEBUG: Da vidimo u konzoli šta se dešava
    console.log("Galerija otvorena. Učitano slika:", trenutneSlikeGalerije.length);

    // 2. Resetuj indeks
    trenutniIndeksSlike = 0;

    // 3. Postavi prvu sliku
    img.src = trenutneSlikeGalerije[0];
    if (caption) caption.innerText = naslov || "";
    
    // 4. Prikaži modal
    modal.style.display = "flex";

    // 5. Sakrij strelice ako ima samo 1 slika
    const arrows = document.querySelectorAll('.gallery-arrow');
    const displayStyle = (trenutneSlikeGalerije.length > 1) ? 'flex' : 'none';
    
    arrows.forEach(arrow => {
        arrow.style.display = displayStyle;
    });
}

window.promeniSliku = function(smer) {
    // Ako nema šta da se vrti, prekini (Zato nije bilo greške, ovde je izlazio)
    if (!trenutneSlikeGalerije || trenutneSlikeGalerije.length <= 1) {
        console.log("Nema dovoljno slika za listanje.");
        return;
    }

    trenutniIndeksSlike += smer;

    // Logika u krug
    if (trenutniIndeksSlike < 0) {
        trenutniIndeksSlike = trenutneSlikeGalerije.length - 1;
    } else if (trenutniIndeksSlike >= trenutneSlikeGalerije.length) {
        trenutniIndeksSlike = 0;
    }

    // Promeni sliku
    const img = document.getElementById('modal-img');
    if (img) {
        img.style.opacity = '0.5'; // Mali blink efekat
        img.src = trenutneSlikeGalerije[trenutniIndeksSlike];
        setTimeout(() => img.style.opacity = '1', 150);
    }
}

window.zatvoriGaleriju = function() {
    const modal = document.getElementById('image-modal');
    if (modal) modal.style.display = "none";
}


// SEO HELPER (Sa Canonical fix-om)
window.postaviSEO = function(naslov, opis, slika) {
    // 1. Menja naslov taba
    document.title = naslov + " | GeekBit";
    
    // 2. Menja meta tagove (za Google i share)
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", naslov);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", opis);
    if(slika) {
        document.querySelector('meta[property="og:image"]')?.setAttribute("content", slika);
    }

    // 3. CANONICAL FIX (Rešava Google "Duplicate" grešku)
    let canonicalLink = document.querySelector("link[rel='canonical']");
    if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
    }
    // Postavlja tačan URL trenutnog oglasa kao "glavni"
    canonicalLink.setAttribute('href', window.location.href);
}
/* =========================================================
   🧙‍♂️ WIZARD FORM LOGIC (FINAL)
   ========================================================= */

// Provera da li promenljiva već postoji da ne bi pucalo
if (typeof currentWizardStep === 'undefined') {
    var currentWizardStep = 0; 
} else {
    currentWizardStep = 0;
}

// Funkcija za prikaz koraka
window.showTab = function(n) {
    let steps = document.getElementsByClassName("form-step");
    
    // SIGURNOSNA PROVERA: Ako forma ne postoji na ovoj strani, prekini!
    if (!steps || steps.length === 0) return;

    // 1. Sakrij sve korake
    for (let i = 0; i < steps.length; i++) {
        steps[i].classList.remove("active-step");
        // Forsiramo CSS hide
        steps[i].style.display = "none"; 
    }
    
    // 2. Prikaži samo traženi korak
    if (steps[n]) {
        steps[n].classList.add("active-step");
        // Forsiramo CSS show (važan !important override u JS-u)
        steps[n].style.display = "block";
    }
    
    // 3. Ažuriraj Progress Bar
    let progress = document.getElementById("progress-fill");
    let counter = document.getElementById("step-counter");
    
    if (progress && counter) {
        let percent = ((n + 1) / steps.length) * 100;
        progress.style.width = percent + "%";
        
        let imena = ["OSNOVNO", "DETALJI", "FINALE"];
        counter.innerHTML = `KORAK ${n + 1}/3: ${imena[n] || ''}`;
    }
    
    // Skroluj na vrh forme
    const formBox = document.querySelector('.glass-form');
    if (formBox) {
        formBox.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
};

// Funkcija za navigaciju (Napred/Nazad)
window.nextPrev = function(n) {
    let steps = document.getElementsByClassName("form-step");
    if (!steps || steps.length === 0) return;

    // Ako ideš napred, proveri validaciju
    if (n === 1 && !validateWizardStep()) return false;
    
    // Promeni indeks koraka
    currentWizardStep = currentWizardStep + n;
    
    // Ako smo došli do kraja
    if (currentWizardStep >= steps.length) {
        return false;
    }
    
    showTab(currentWizardStep);
};

// Provera da li su polja popunjena
function validateWizardStep() {
    let steps = document.getElementsByClassName("form-step");
    if (!steps[currentWizardStep]) return true; // Safety check

    let inputs = steps[currentWizardStep].querySelectorAll("input[required], select[required], textarea[required]");
    let isValid = true;

    inputs.forEach(input => {
        if (input.value.trim() === "") {
            input.style.borderColor = "#ff4d4d";
            isValid = false;
            // Dodaj event da se skine crveno kad krene da kuca
            input.addEventListener('input', function() {
                this.style.borderColor = "#444";
            });
        } else {
            input.style.borderColor = "#444";
        }
    });

    if (!isValid) {
        alert("Molimo popunite sva obavezna polja!");
    }
    return isValid;
}

// INICIJALIZACIJA
document.addEventListener("DOMContentLoaded", () => {
    const steps = document.getElementsByClassName("form-step");
    if (steps.length > 0) {
        currentWizardStep = 0;
        showTab(currentWizardStep);
    }
});





// ==========================================
// 🤝 SISTEM REZERVACIJE I POTVRDE PRODAJE
// ==========================================

window.zatraziKupovinu = async function(oglasId, oglasTitle, sellerId, event, cenaOglasa) { // 🔥 Dodali smo cenaOglasa ovde
    if(event) event.stopPropagation(); 
    
    const { data: { user } } = await sb.auth.getUser();
    if(!user) {
        prikaziAlert("PAŽNJA", "Morate biti prijavljeni da biste rezervisali oglas.");
        return;
    }
    if(user.id === sellerId) {
        prikaziAlert("GREŠKA", "Ne možete rezervisati sopstveni oglas.");
        return;
    }

    // Proveri da li je već tražio
    const { data: postojece } = await sb.from('transactions')
        .select('*')
        .eq('listing_id', oglasId)
        .eq('buyer_id', user.id);
        
    if(postojece && postojece.length > 0) {
        prikaziAlert("OBAVEŠTENJE", "Već ste poslali zahtev za kupovinu ovog oglasa.");
        return;
    }

    const buyerName = user.user_metadata.full_name || user.email.split('@')[0];

    // Šaljemo sve podatke u bazu
    const { error } = await sb.from('transactions').insert({
        listing_id: oglasId,
        listing_title: oglasTitle,
        buyer_id: user.id,
        buyer_name: buyerName,
        seller_id: sellerId,
        status: 'pending',
        price: cenaOglasa // 🔥 OVO JE FALILO! Sada se cena trajno upisuje u bazu
    });

    if(error) {
        prikaziAlert("GREŠKA", "Pokušajte ponovo: " + error.message);
    } else {
        prikaziAlert("USPEH 🤝", "Zahtev poslat! Kada prodavac potvrdi da ste kupili, moći ćete da ga ocenite.");
    }
}

window.potvrdiProdaju = async function(oglasId) {
    // 1. Vučemo kupce iz baze
    const { data: kupci } = await sb.from('transactions')
        .select('*')
        .eq('listing_id', oglasId)
        .eq('status', 'pending');
    
    if(!kupci || kupci.length === 0) {
        prikaziAlert("NEMA ZAHTEVA", "Niko još nije zatražio kupovinu ovog predmeta preko sajta.\nNeka kupac prvo klikne na ikonicu rukovanja (🤝) na vašem oglasu!");
        return;
    }

    // 2. Pronalazimo modal u HTML-u
    const modal = document.getElementById('buyer-modal');
    const lista = document.getElementById('buyer-list');
    
    if(!modal || !lista) return;

    // 3. Čistimo staru listu i pravimo prelepe dugmiće za svakog kupca
    lista.innerHTML = '';
    
    kupci.forEach(k => {
        const btn = document.createElement('button');
        btn.innerHTML = `<i class="fas fa-user"></i> ${k.buyer_name}`;
        // Malo inline CSS-a za fensi izgled
        btn.style.padding = "12px";
        btn.style.background = "#111";
        btn.style.color = "#fff";
        btn.style.border = "1px solid gold";
        btn.style.borderRadius = "8px";
        btn.style.cursor = "pointer";
        btn.style.fontSize = "1rem";
        btn.style.transition = "0.3s";
        
        // Hover efekat
        btn.onmouseover = () => { btn.style.background = "gold"; btn.style.color = "#000"; };
        btn.onmouseleave = () => { btn.style.background = "#111"; btn.style.color = "#fff"; };

        // Kad se klikne na ime, pokreće se prodaja
        btn.onclick = () => zavrsiTransakcijuSaKupcem(k.id, k.buyer_name, oglasId);
        
        lista.appendChild(btn);
    });

    // Otvaramo modal
    modal.style.display = 'flex';
}

// Funkcija koja zapravo vrši brisanje oglasa i upis ocene
window.zavrsiTransakcijuSaKupcem = async function(transactionId, buyerName, oglasId) {
    document.getElementById('buyer-modal').style.display = 'none';

    // Upisujemo u bazu da je prodato njemu
    await sb.from('transactions').update({ status: 'completed' }).eq('id', transactionId);

    // Brišemo oglas sa sajta jer je prodat
    await sb.from('listings').delete().eq('id', oglasId);

    prikaziAlert("USPEŠNO PRODATO! 🎉", `Predmet je zvanično prodat korisniku ${buyerName}. On sada može da vas oceni!`);
    
    // Osveži listu oglasa na profilu
    if(typeof ucitajMojeOglase === 'function') ucitajMojeOglase(); 
}


// ==========================================
// 🛍️ UCITAVANJE KUPLJENIH PREDMETA (ZA KUPCA)
// ==========================================
window.ucitajMojeKupovine = async function() {
    const container = document.getElementById('moje-kupovine-lista');
    if(!container) return; 

    const { data: { user } } = await sb.auth.getUser();
    if(!user) return;

    const { data: kupovine } = await sb.from('transactions')
        .select('*')
        .eq('buyer_id', user.id)
        .eq('status', 'completed');

    if(!kupovine || kupovine.length === 0) {
        container.innerHTML = '<p style="color: #555; text-align: center; width: 100%;">Još uvek niste ništa kupili preko sajta.</p>';
        return;
    }

    // 🔥 NOVO: Stilizujemo kontejner da bude fiksne visine sa sopstvenim scroll-om
    container.style.maxHeight = "400px";
    container.style.overflowY = "auto";
    container.style.paddingRight = "10px";
    container.style.border = "1px solid #222";
    container.style.borderRadius = "8px";
    container.style.background = "#0a0a0a";
    container.style.padding = "15px";

    let html = '';
    kupovine.forEach(k => {
        html += `
        <div style="background: #111; border: 1px solid #333; border-left: 4px solid gold; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
            <h4 style="color: #fff; margin-bottom: 5px; font-family: 'Nulshock'; font-size: 0.9rem;">${k.listing_title}</h4>
            <p style="color: #888; font-size: 0.8rem; margin-bottom: 15px;">Datum: ${new Date(k.created_at).toLocaleDateString()}</p>
            <button onclick="oceniIzKupovina('${k.seller_id}')" style="background: rgba(255,215,0,0.1); color: gold; border: 1px solid gold; padding: 8px 15px; border-radius: 4px; cursor: pointer; transition: 0.3s; font-size: 0.85rem;" onmouseover="this.style.background='gold'; this.style.color='#000';" onmouseout="this.style.background='rgba(255,215,0,0.1)'; this.style.color='gold';">
                ⭐ OCENI PRODAVCA
            </button>
        </div>
        `;
    });
    
    container.innerHTML = html;
}
// Otvara modal za ocenu direktno iz liste kupovina
window.oceniIzKupovina = function(sellerId) {
    window.trenutniProdavacIdZaReview = sellerId;
    const modal = document.getElementById('review-modal');
    if(modal) {
        modal.style.display = 'flex';
        if(typeof resetStars === 'function') resetStars();
    } else {
        prikaziAlert("GREŠKA", "Modal za ocenjivanje nije pronađen na ovoj stranici.");
    }
}

// ==========================================
// ⭐ JEDINSTVEN SISTEM OCENJIVANJA (PROFIL + BERZA)
// ==========================================

window.trenutnaOcena = 0; // Globalna varijabla koja pamti klik

// 1. Funkcija za bojenje zvezdica (Klik na zvezdicu)
window.odaberiZvezdicu = function(ocena) {
    window.trenutnaOcena = ocena;
    // Tražimo sve zvezdice u modalima na stranici
    const zvezdice = document.querySelectorAll('.star-ikona, .fas.fa-star[onclick*="setRating"]');
    
    zvezdice.forEach((zvezda, index) => {
        if (index < ocena) {
            zvezda.style.color = 'gold';
        } else {
            zvezda.style.color = '#444';
        }
    });
};

// 2. Funkcija za slanje u bazu (Reviews tabela)
window.posaljiOcenu = async function() {
    // Provera zvezdica
    if (!window.trenutnaOcena || window.trenutnaOcena === 0) {
        prikaziAlert("ZVEZDICE?", "Molimo te odaberi broj zvezdica pre slanja! ⭐");
        return;
    }

    // Provera polja za tekst (pazimo na oba moguća ID-a)
    const komentarPolje = document.getElementById('review-text') || document.getElementById('review-comment');
    const komentar = komentarPolje ? komentarPolje.value : "";

    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
        prikaziAlert("PRIJAVA", "Moraš biti ulogovan.");
        return;
    }
    
    const sellerId = window.trenutniProdavacIdZaReview;
    if (!sellerId) {
        prikaziAlert("GREŠKA", "ID prodavca nije pronađen.");
        return;
    }

    try {
        const { error } = await sb.from('reviews').insert({
            rating: window.trenutnaOcena, // Tvoja kolona u bazi je 'rating'
            comment: komentar,
            reviewer_id: user.id,
            seller_id: sellerId,
            reviewer_name: user.user_metadata.full_name || user.email.split('@')[0]
        });

        if (error) {
            if (error.message.includes('unique_review')) {
                throw new Error("OCENA: Već ste ocenili ovog prodavca.");
            }
            throw error;
        }

        const modal = document.getElementById('review-modal');
        if(modal) modal.style.display = 'none';
        
        prikaziAlert("HVALA! ⭐", "Ocena uspešno sačuvana.");
        window.trenutnaOcena = 0; // Reset
        if(komentarPolje) komentarPolje.value = '';
        
    } catch (err) {
        prikaziAlert("INFO", err.message);
    }
};




// ==========================================
// 🚀 LOGIKA ZA POJEDINAČNI OGLAS (oglas.html)
// ==========================================

/// ==========================================
// 🚀 LOGIKA ZA POJEDINAČNI OGLAS (oglas.html)
// ==========================================

window.ucitajPojedinacniOglas = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const oglasId = urlParams.get('id');

    if (!oglasId) {
        window.location.href = "komponente.html"; // Ako nema ID-a, vrati ga na Berzu
        return;
    }

// Povuci oglas iz baze (DODATO premium_do)
    const { data: oglas, error } = await sb.from('listings')
        .select('*, profiles(company_name, is_verified, premium_do)') 
        .eq('id', oglasId)
        .single();

if (error || !oglas) {
        document.getElementById('loading-spinner').innerHTML = "<h2 style='color:red;'>Oglas nije pronađen ili je obrisan.</h2><a href='komponente.html' style='color:#fff;'>Nazad na berzu</a>";
        return;
    }

// Sakrij spinner i prikaži content
    document.getElementById('loading-spinner').style.display = 'none';
    document.getElementById('single-ad-content').style.display = 'grid';
    
   // 🔥 GEEKBIT SMART VIEWS LOGIKA (Sprečava F5 spam) 🔥
    let pregledaniOglasi = JSON.parse(localStorage.getItem('geekbit_pregledi')) || [];
    
    // Ako korisnik NIJE u lokalnoj memoriji zabeležen da je gledao ovaj oglas:
    if (!pregledaniOglasi.includes(oglasId)) {
        const noviBrojPregleda = (oglas.views || 0) + 1; 
        
        // Zovemo našu specijalnu VIP funkciju u bazi
        sb.rpc('dodaj_pregled', { row_id: oglasId }).then();
        
        // Pamtimo u njegovom brauzeru da je sada video oglas
        pregledaniOglasi.push(oglasId);
        localStorage.setItem('geekbit_pregledi', JSON.stringify(pregledaniOglasi));
        
        oglas.views = noviBrojPregleda; // Ažuriraj za prikaz na ekranu
    }

    // Osnovni podaci
    document.getElementById('ad-title').innerText = oglas.title;
    document.getElementById('ad-price').innerText = oglas.price + " €";
    document.getElementById('ad-badge').innerText = oglas.category.toUpperCase();
    document.getElementById('ad-condition').innerText = oglas.condition;
    document.getElementById('ad-description').innerText = oglas.description;

    // Prodavac i provera verifikacije (🔥 ZAMENI OVE TRI LINIJE)
    const premiumDo = oglas.profiles?.premium_do ? new Date(oglas.profiles.premium_do) : null;
    const isVerified = premiumDo && premiumDo > new Date();
    const prodavacIme = oglas.profiles?.company_name || oglas.seller_name;
    
    // Upisujemo ime i zlatnu kvačicu ako je verified
 document.getElementById('ad-seller-name').innerHTML = prodavacIme + (isVerified ? ' <i class="fas fa-gem" style="color:gold; font-size:1rem;" title="GeekBit Supporter"></i>' : '');
    
    // Farbanje čovečuljka i ivice kutije
    const sellerIcon = document.getElementById('ad-seller-icon');
    const sellerBox = document.getElementById('seller-box');
    
    if (isVerified) {
        if(sellerIcon) sellerIcon.style.color = "gold";
        if(sellerBox) sellerBox.style.borderLeft = "4px solid gold";
    } else {
        if(sellerIcon) sellerIcon.style.color = "var(--accent)";
        if(sellerBox) sellerBox.style.borderLeft = "4px solid var(--accent)";
    }

    // Klik na prodavca
    document.getElementById('seller-box').onclick = function() {
        sessionStorage.setItem('open_seller', JSON.stringify({
            prodavacId: oglas.user_id, ime: prodavacIme, email: oglas.user_email, telefon: oglas.phone
        }));
        window.location.href = 'komponente.html';
    };

    // Slike i Galerija (POPRAVLJENO: Definisano samo jednom!)
    const images = (oglas.images && oglas.images.length > 0) ? oglas.images : ['assets/img/neon-logo1.png'];
    
    // 🔥 SEO DEO: Podaci se upisuju u Head 
    if (typeof postaviSEO === 'function') {
        const kratakOpis = `${oglas.price} € | Stanje: ${oglas.condition} | Prodavac: ${prodavacIme}`;
        postaviSEO(oglas.title, kratakOpis, images[0]);
    }

const mainImg = document.getElementById('main-ad-image');
    mainImg.src = images[0];
    
    // 🔥 POPRAVLJEN DEO: Direktno vezivanje funkcije (bez pucanja stringova)
    mainImg.onclick = function(e) {
        e.stopPropagation(); // Sprečava bilo kakve konflikte
        window.otvoriGaleriju(images, oglas.title);
    };
    mainImg.style.cursor = 'zoom-in'; // Kursor se pretvara u lupicu da kupac zna da može da uveća

    const thumbContainer = document.getElementById('ad-thumbnails');
    if (images.length > 1) {
        thumbContainer.innerHTML = images.map((img, index) => `
            <img src="${img}" class="thumbnail-img ${index === 0 ? 'active' : ''}" 
                 onclick="document.getElementById('main-ad-image').src='${img}'; 
                          document.querySelectorAll('.thumbnail-img').forEach(el=>el.classList.remove('active')); 
                          this.classList.add('active');">
        `).join('');
    }

    // Vezivanje Dugmića
    document.getElementById('btn-add-cart').onclick = function() {
        dodajUKorpu(oglas.id, oglas.title, oglas.price, images[0], prodavacIme, oglas.phone, oglas.user_email, oglas.category, oglas.description);
    };

    document.getElementById('btn-handshake').onclick = function(e) {
        zatraziKupovinu(oglas.id, oglas.title, oglas.user_id, e);
    };

    document.getElementById('btn-contact').onclick = function() {
        otvoriKontaktModal(prodavacIme, oglas.user_email, oglas.phone);
    };
}


// ==========================================
// 📊 HERO STATISTIKA (LIVE DATA)
// ==========================================
window.ucitajHeroStatistiku = async function() {
    const statOglasi = document.getElementById('stat-oglasi');
    const statKorisnici = document.getElementById('stat-korisnici');
    const statVrednost = document.getElementById('stat-vrednost');

    if(!statOglasi) return; // Nismo na Index strani

    try {
        // 1. Broj aktivnih oglasa
        const { count: brOglasa } = await sb
            .from('listings')
            .select('*', { count: 'exact', head: true });

        // 2. Broj korisnika
        const { count: brKorisnika } = await sb
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // 3. Ukupna vrednost berze (SUM cena)
        const { data: cene } = await sb
            .from('listings')
            .select('price');
        
        const ukupnaVrednost = cene ? cene.reduce((acc, item) => acc + (item.price || 0), 0) : 0;

        // Pokreni animaciju brojeva
        animateValue(statOglasi, 0, brOglasa || 0, 2000);
        animateValue(statKorisnici, 0, brKorisnika || 0, 2000);
        animateValue(statVrednost, 0, ukupnaVrednost, 2500, true);

    } catch (err) {
        console.error("Greška pri učitavanju statistike:", err);
    }
};

// Helper za animaciju brojeva
function animateValue(obj, start, end, duration, isCurrency = false) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        let currentVal = Math.floor(easeOutQuad * (end - start) + start);
        
        let formatted = currentVal.toLocaleString('de-DE'); 
        if (isCurrency) formatted += " €";
        
        obj.innerHTML = formatted;
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            let final = end.toLocaleString('de-DE');
            if (isCurrency) final += " €";
            obj.innerHTML = final;
        }
    };
    window.requestAnimationFrame(step);
}


// ==========================================
// 🛸 INICIJALIZACIJA LEBDEĆIH HARDVER IKONICA
// ==========================================
window.inicijalizujLebdeceIkonice = function() {
    const container = document.getElementById('hardware-orbs');
    
    // Ako nismo na Index strani, prekini
    if(!container) return;

    // Lista FontAwesome ikonica koje želimo (Tech/Hardver)
    const techIcons = [
        'fa-microchip', // CPU
        'fa-memory',    // RAM
        'fa-hdd',       // Hard Disk
        'fa-plug',      // Napajanje/Kabal
        'fa-server',    // Server/Baza
        'fa-keyboard',  // Periferije
        'fa-mouse',     // Miš
        'fa-desktop',   // Monitor/Konfiguracija
        'fa-fan',       // Hlađenje
        'fa-satellite-dish' // Mreža
    ];

    const brojIkonica = 15; // Koliko ikonica želimo na ekranu

    for (let i = 0; i < brojIkonica; i++) {
        // 1. Kreiraj element
        const icon = document.createElement('i');
        
        // 2. Izaberi nasumičnu ikonicu iz liste
        const randomIconName = techIcons[Math.floor(Math.random() * techIcons.length)];
        icon.className = `fas ${randomIconName} floating-icon`;

        // 3. Nasumični parametri za CSS (da ne lete sve isto)
        
        // Pozicija levo (0% do 100%)
        icon.style.left = `${Math.random() * 100}%`;
        
        // Veličina (nasumično između 1rem i 2.5rem)
        const randomSize = 1 + Math.random() * 1.5;
        icon.style.fontSize = `${randomSize}rem`;
        
        // Trajanje animacije (nasumično između 15s i 30s - sporije/brže)
        const randomDuration = 15 + Math.random() * 15;
        icon.style.animationDuration = `${randomDuration}s`;
        
        // Kašnjenje početka (nasumično do 20s, da ne krenu sve odjednom)
        const randomDelay = Math.random() * 20;
        icon.style.animationDelay = `${randomDelay}s`;
        
        // Nasumična providnost (mrvicu varira)
        icon.style.opacity = (0.1 + Math.random() * 0.1).toString();

        // 4. Ubaci u kontejner
        container.appendChild(icon);
    }
}


// ==========================================
// 🚀 SCROLL TO TOP LOGIKA
// ==========================================
const scrollBtn = document.getElementById("scrollToTopBtn");

window.onscroll = function() {
    prikaziDugme();
};

function prikaziDugme() {
    if (!scrollBtn) return;
    
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        scrollBtn.classList.add("show");
    } else {
        scrollBtn.classList.remove("show");
        // Mali hack da se ne vidi animacija izlaska, samo ga sakrijemo posle css-a
        setTimeout(() => {
            if(!scrollBtn.classList.contains("show")) scrollBtn.style.display = "none";
        }, 300); // Čeka kraj potencijalne animacije (opciono)
    }
    
    // Ako ima klasu show, mora biti block
    if (scrollBtn.classList.contains("show")) {
        scrollBtn.style.display = "block";
    }
}

// Funkcija za klik
window.scrollToTop = function() {
    window.scrollTo({
        top: 0,
        behavior: "smooth" // Glatko klizanje na vrh
    });
};

// ==========================================
// 🚀 PRELOADER LOGIKA
// ==========================================
window.addEventListener('load', function() {
    // Čekamo da se sve slike i resursi učitaju
    const preloader = document.getElementById('preloader');
    
    // Malo veštačkog kašnjenja da bi se videla animacija (opciono, možeš smanjiti)
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 800); // 0.8 sekundi
});


// ==========================================
// 📱 PWA SERVICE WORKER REGISTRACIJA
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registrovan sa opsegom:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker registracija nije uspela:', error);
      });
  });
}

// ==========================================
// 🧹 FUNKCIJA ZA TOTALNI RESET FILTERA
// ==========================================
window.resetujFiltere = function() {
    // 1. Resetovanje tekstualne pretrage
    const searchInput = document.getElementById('search-input');
    if(searchInput) searchInput.value = "";

    // 2. Resetovanje grada
    const gradFilter = document.getElementById('gradFilter');
    if(gradFilter) gradFilter.value = "svi";

    // 3. Resetovanje polja za cenu i slajdera
    const minCena = document.getElementById('minCena');
    const maxCena = document.getElementById('maxCena');
    const cenaSlajder = document.getElementById('cenaSlajder');
    const prikazSlajdera = document.getElementById('prikazSlajdera');

    if(minCena) minCena.value = "";
    if(maxCena) maxCena.value = "";
    if(cenaSlajder) cenaSlajder.value = 3000;
    if(prikazSlajdera) prikazSlajdera.innerText = "3000";

    // 4. Resetovanje tagova (skida zelenu boju sa specifikacija)
    aktivniFilteri = [];
    document.querySelectorAll('#sidebar-tags-container .tag-btn.active').forEach(btn => {
        btn.classList.remove('active');
    });

    // 5. Opciono: Vraćanje sortiranja na "Najnovije"
    const sortSelect = document.getElementById('sort-select');
    if(sortSelect) sortSelect.value = "newest";

    // 6. Odmah osveži prikaz i zatvori bočni meni da korisnik vidi rezultate
    window.osveziPrikaz();
    window.zatvoriFiltere(); 
};

// ==========================================
// 🎚️ SINHRONIZACIJA SLAJDERA ZA CENU
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const cenaSlajder = document.getElementById('cenaSlajder');
    const maxCenaInput = document.getElementById('maxCena');
    const prikazSlajdera = document.getElementById('prikazSlajdera');

    if(cenaSlajder && maxCenaInput && prikazSlajdera) {
        // Kada se vuče slajder mišem ili prstom
        cenaSlajder.addEventListener('input', (e) => {
            prikazSlajdera.innerText = e.target.value;
            maxCenaInput.value = e.target.value;
            // Odmah primeni na listu oglasa
            if(typeof window.osveziPrikaz === 'function') window.osveziPrikaz();
        });

        // Kada se ručno kuca broj u polje "Do"
        maxCenaInput.addEventListener('input', (e) => {
            let val = e.target.value || 3000;
            if(val > 3000) val = 3000; // Ne damo preko 3000€ na slajderu
            cenaSlajder.value = val;
            prikazSlajdera.innerText = val;
        });
    }
});

// ==========================================
// 🛍️ TOGGLE ZA "MOJE KUPOVINE" 
// ==========================================
window.toggleKupovine = function() {
    const container = document.getElementById('moje-kupovine-container');
    const btn = document.getElementById('btn-kupovine');
    
    if (container && btn) {
        if (container.style.display === 'none') {
            container.style.display = 'block';
            btn.innerHTML = '<i class="fas fa-eye-slash" style="margin-right: 8px;"></i> SAKRIJ MOJE KUPOVINE';
            btn.style.borderColor = '#ff4d4d'; 
            btn.style.color = '#ff4d4d';
            btn.onmouseover = function() { this.style.background = '#ff4d4d'; this.style.color = '#fff'; }
            btn.onmouseout = function() { this.style.background = 'transparent'; this.style.color = '#ff4d4d'; }
            
            // Okida učitavanje
            window.ucitajKupovine();
        } else {
            container.style.display = 'none';
            btn.innerHTML = '<i class="fas fa-shopping-bag" style="margin-right: 8px;"></i> PRIKAŽI MOJE KUPOVINE';
            btn.style.borderColor = 'var(--accent)'; 
            btn.style.color = 'var(--accent)';
            btn.onmouseover = function() { this.style.background = 'var(--accent)'; this.style.color = '#000'; }
            btn.onmouseout = function() { this.style.background = 'transparent'; this.style.color = 'var(--accent)'; }
        }
    }
};

// ==========================================
// 🛒 UČITAVANJE ISTORIJE 
// ==========================================
window.ucitajKupovine = async function() {
    const container = document.getElementById('purchases-list');
    if (!container) return; 

    container.innerHTML = '<p style="text-align: center; color: #888;">Učitavanje podataka...</p>';

    try {
        const { data: authData } = await sb.auth.getUser();
        if (!authData || !authData.user) {
            container.innerHTML = '<p style="text-align: center; color: var(--error);">Morate biti prijavljeni.</p>';
            return;
        }

        const { data: kupovine, error } = await sb
            .from('transactions')
            .select('*') 
            .eq('buyer_id', authData.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!kupovine || kupovine.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">Još uvek nemate obavljenih kupovina.</p>';
            return;
        }

        container.innerHTML = kupovine.map(k => {
            const naslovOglasa = k.listing_title || "Artikal"; 
            
            // 🔥 POPRAVKA ZA CENU: Ako je prazno ili piše Dogovor, ne ispisuje simbol za Evro!
            let prikazCene = "Dogovor";
            if (k.price && k.price.toString().toLowerCase() !== "dogovor") {
                prikazCene = `${k.price} €`;
            }

            const sellerId = k.seller_id;

            return `
            <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; border-left: 4px solid var(--accent); margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                <div>
                    <h4 style="color: #fff; margin-bottom: 5px; font-size: 1.1rem;">${naslovOglasa}</h4>
                    <p style="color: #888; font-size: 0.85rem;">Kupljeno: ${new Date(k.created_at).toLocaleDateString('sr-RS')}</p>
                </div>
                <div style="text-align: right; display: flex; align-items: center; gap: 15px;">
                    <span style="color: var(--accent); font-weight: bold; font-size: 1.2rem;">${prikazCene}</span>
                    
                    ${sellerId ? `
                    <button onclick="oceniProdavcaIzIstorije('${sellerId}')" style="background: rgba(255, 215, 0, 0.1); border: 1px solid gold; color: gold; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: bold; transition: 0.3s;" onmouseover="this.style.background='gold'; this.style.color='#000';" onmouseout="this.style.background='rgba(255, 215, 0, 0.1)'; this.style.color='gold';">
                        <i class="fas fa-star" style="margin-right: 5px;"></i> OCENI
                    </button>
                    ` : ''}
                </div>
            </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Greška:", err);
        container.innerHTML = '<p style="color: var(--error); text-align: center;">Došlo je do greške pri učitavanju istorije.</p>';
    }
};

// ==========================================
// ⭐ POKRETANJE OCENJIVANJA IZ ISTORIJE
// ==========================================
window.oceniProdavcaIzIstorije = function(sellerId) {
    // 🔥 POPRAVLJENO: Sada se gađa sa tvojom varijablom!
    window.trenutniProdavacIdZaReview = sellerId; 
    
    // Otvaramo tvoj postojeći modal za ocenjivanje
    const modal = document.getElementById('review-modal');
    if (modal) {
        modal.style.display = 'flex'; // Modal na sredini
        
        // Brišemo stari tekst ako je ostao u modalu
        const reviewText = document.getElementById('review-text');
        if (reviewText) reviewText.value = '';
        
        // Resetujemo zvezdice
        if (typeof window.odaberiZvezdicu === 'function') {
            window.odaberiZvezdicu(0);
        }
    } else {
        console.error("Modal za ocenjivanje nije pronađen u HTML-u!");
    }
};


// ==========================================
// 🗑️ ZATVARANJE MODALA ZA BRISANJE
// ==========================================
window.zatvoriDeleteModal = function() {
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.style.display = "none";
    }
};


