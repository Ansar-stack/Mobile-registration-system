import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

export const AFGHANISTAN = [
  { en: 'Kabul', ps: 'کابل', districts: [
    { en: 'Kabul City', ps: 'کابل ښار' }, { en: 'Paghman', ps: 'پغمان' }, { en: 'Bagrami', ps: 'بګرامي' },
    { en: 'Deh Sabz', ps: 'ده سبز' }, { en: 'Shakardara', ps: 'شکردره' }, { en: 'Kalakan', ps: 'کلکان' },
    { en: 'Mir Bacha Kot', ps: 'میربچه کوت' }, { en: 'Musahi', ps: 'موسهي' },
    { en: 'Chahar Asiab', ps: 'چهار آسیاب' }, { en: 'Qarabagh', ps: 'قرهباغ' }, { en: 'Estalif', ps: 'استالف' },
  ]},
  { en: 'Herat', ps: 'هرات', districts: [
    { en: 'Herat City', ps: 'هرات ښار' }, { en: 'Guzara', ps: 'ګذره' }, { en: 'Injil', ps: 'انجیل' },
    { en: 'Pashtun Zarghun', ps: 'پښتون زرغون' }, { en: 'Kohsan', ps: 'کوهسان' }, { en: 'Ghoryan', ps: 'غوریان' },
    { en: 'Shindand', ps: 'شینډنډ' }, { en: 'Zendajan', ps: 'زندهجان' }, { en: 'Obe', ps: 'اوبه' }, { en: 'Gulran', ps: 'ګلران' },
  ]},
  { en: 'Kandahar', ps: 'کندهار', districts: [
    { en: 'Kandahar City', ps: 'کندهار ښار' }, { en: 'Dand', ps: 'ډنډ' }, { en: 'Daman', ps: 'دامان' },
    { en: 'Spin Boldak', ps: 'سپین بولدک' }, { en: 'Panjwai', ps: 'پنجوايي' }, { en: 'Zhari', ps: 'ژړی' },
    { en: 'Arghandab', ps: 'ارغنداب' }, { en: 'Maruf', ps: 'معروف' },
  ]},
  { en: 'Balkh', ps: 'بلخ', districts: [
    { en: 'Mazar-i-Sharif', ps: 'مزار شریف' }, { en: 'Balkh', ps: 'بلخ' }, { en: 'Dawlatabad', ps: 'دولتآباد' },
    { en: 'Charbolak', ps: 'چاربولک' }, { en: 'Chimtal', ps: 'چمتال' }, { en: 'Sholgara', ps: 'شولګره' },
    { en: 'Kaldar', ps: 'کلدار' }, { en: 'Kishindeh', ps: 'کشنده' },
  ]},
  { en: 'Nangarhar', ps: 'ننګرهار', districts: [
    { en: 'Jalalabad', ps: 'جلال آباد' }, { en: 'Behsud', ps: 'بهسود' }, { en: 'Shinwar', ps: 'شینوار' },
    { en: 'Khogyani', ps: 'خوګیاني' }, { en: 'Chaparhar', ps: 'چپرهار' }, { en: 'Rodat', ps: 'رودات' },
    { en: 'Surkh Rod', ps: 'سرخرود' }, { en: 'Pachir Aw Agam', ps: 'پچیراګام' }, { en: 'Kot', ps: 'کوټ' },
  ]},
  { en: 'Kunduz', ps: 'کندز', districts: [
    { en: 'Kunduz City', ps: 'کندز ښار' }, { en: 'Khan Abad', ps: 'خانآباد' }, { en: 'Ali Abad', ps: 'عليآباد' },
    { en: 'Imam Sahib', ps: 'امام صاحب' }, { en: 'Chardara', ps: 'چهاردره' }, { en: 'Dasht-e Archi', ps: 'دشت ارچي' },
  ]},
  { en: 'Ghazni', ps: 'غزني', districts: [
    { en: 'Ghazni City', ps: 'غزني ښار' }, { en: 'Andar', ps: 'اندړ' }, { en: 'Jaghori', ps: 'جاغوري' },
    { en: 'Malistan', ps: 'مالستان' }, { en: 'Qarabagh', ps: 'قرهباغ' }, { en: 'Khwaja Umari', ps: 'خواجه عمري' },
    { en: 'Deh Yak', ps: 'ده یک' }, { en: 'Gilan', ps: 'ګیلان' },
  ]},
  { en: 'Badakhshan', ps: 'بدخشان', districts: [
    { en: 'Fayzabad', ps: 'فیض آباد' }, { en: 'Ishkashim', ps: 'اشکاشم' }, { en: 'Shughnan', ps: 'شغنان' },
    { en: 'Wakhan', ps: 'واخان' }, { en: 'Jurm', ps: 'جرم' }, { en: 'Kuran wa Munjan', ps: 'کران و منجان' },
    { en: 'Khash', ps: 'خاش' }, { en: 'Raghistan', ps: 'راغستان' },
  ]},
  { en: 'Badghis', ps: 'بادغیس', districts: [
    { en: 'Qala-e-Naw', ps: 'قلعه نو' }, { en: 'Bala Murghab', ps: 'بالا مرغاب' }, { en: 'Qadis', ps: 'قادس' },
    { en: 'Ab Kamari', ps: 'آبکمری' }, { en: 'Muqur', ps: 'مقر' },
  ]},
  { en: 'Baghlan', ps: 'بغلان', districts: [
    { en: 'Pul-e-Khumri', ps: 'پل خمري' }, { en: 'Baghlan-e-Markazi', ps: 'بغلان مرکزی' },
    { en: 'Dahana-e-Ghori', ps: 'دهنه غوري' }, { en: 'Burka', ps: 'بورکه' },
    { en: 'Tala wa Barfak', ps: 'تاله و برفک' }, { en: 'Khinjan', ps: 'خنجان' }, { en: 'Nahrin', ps: 'نهرين' },
  ]},
  { en: 'Bamyan', ps: 'بامیان', districts: [
    { en: 'Bamyan City', ps: 'بامیان ښار' }, { en: 'Yakawlang', ps: 'یکاولنګ' }, { en: 'Shibar', ps: 'شیبر' },
    { en: 'Kahmard', ps: 'کهمرد' }, { en: 'Panjab', ps: 'پنجاب' },
  ]},
  { en: 'Farah', ps: 'فراه', districts: [
    { en: 'Farah City', ps: 'فراه ښار' }, { en: 'Lash wa Juwayn', ps: 'لاش و جوین' }, { en: 'Bala Buluk', ps: 'بالا بلوک' },
    { en: 'Khak-e-Safid', ps: 'خاک سفید' }, { en: 'Shib Koh', ps: 'شیب کوه' }, { en: 'Pusht Rod', ps: 'پشت رود' },
  ]},
  { en: 'Faryab', ps: 'فاریاب', districts: [
    { en: 'Maymana', ps: 'میمنه' }, { en: 'Andkhoy', ps: 'اندخوی' }, { en: 'Qaramqol', ps: 'قرمقول' },
    { en: 'Shirin Tagab', ps: 'شیرین تګاب' }, { en: 'Dawlatabad', ps: 'دولت آباد' }, { en: 'Khwaja Sabz Posh', ps: 'خواجه سبزپوش' },
  ]},
  { en: 'Ghor', ps: 'غور', districts: [
    { en: 'Chaghcharan', ps: 'چغچران' }, { en: 'Dawlatyar', ps: 'دولتیار' }, { en: 'Shahrak', ps: 'شهرک' },
    { en: 'Tewara', ps: 'تیوره' }, { en: 'Pasaband', ps: 'پسابند' }, { en: 'Saghar', ps: 'ساغر' },
  ]},
  { en: 'Helmand', ps: 'هلمند', districts: [
    { en: 'Lashkargah', ps: 'لښکرګاه' }, { en: 'Nawa-i-Barakzai', ps: 'نوزاد' }, { en: 'Nad Ali', ps: 'نادعلي' },
    { en: 'Gereshk', ps: 'ګرېشک' }, { en: 'Sangin', ps: 'سنګین' }, { en: 'Musa Qala', ps: 'موسی قلعه' },
    { en: 'Kajaki', ps: 'کجکي' }, { en: 'Marjah', ps: 'مارجه' }, { en: 'Washir', ps: 'واشېر' }, { en: 'Nawzad', ps: 'نوزاد' },
  ]},
  { en: 'Jawzjan', ps: 'جوزجان', districts: [
    { en: 'Sheberghan', ps: 'شبرغان' }, { en: 'Aqcha', ps: 'اقچه' }, { en: 'Mardyan', ps: 'مردیان' },
    { en: 'Qarqin', ps: 'قرقین' }, { en: 'Khamyab', ps: 'خمیاب' }, { en: 'Qush Tepa', ps: 'قوشتیپه' },
    { en: 'Darzab', ps: 'درزاب' }, { en: 'Khwaja Du Koh', ps: 'خواجه دوکوه' },
  ]},
  { en: 'Khost', ps: 'خوست', districts: [
    { en: 'Khost City', ps: 'خوست ښار' }, { en: 'Tani', ps: 'تڼي' }, { en: 'Mandozai', ps: 'مندوزی' },
    { en: 'Sabari', ps: 'سبري' }, { en: 'Nadir Shah Kot', ps: 'نادرشاه کوت' }, { en: 'Gurbuz', ps: 'ګربز' },
    { en: 'Spera', ps: 'سپیره' }, { en: 'Bak', ps: 'باک' },
  ]},
  { en: 'Kunar', ps: 'کونړ', districts: [
    { en: 'Asadabad', ps: 'اسعد آباد' }, { en: 'Asmar', ps: 'اسمار' }, { en: 'Nari', ps: 'ناری' },
    { en: 'Sirkanay', ps: 'سرکانو' }, { en: 'Dangam', ps: 'دانګام' }, { en: 'Wata Pur', ps: 'وټه پور' },
    { en: 'Shigal wa Sheltan', ps: 'شیګل و شیلتن' }, { en: 'Khas Kunar', ps: 'خاص کونړ' },
  ]},
  { en: 'Laghman', ps: 'لغمان', districts: [
    { en: 'Mehtarlam', ps: 'مهترلام' }, { en: 'Alingar', ps: 'الینګار' }, { en: 'Alishing', ps: 'الیشنګ' },
    { en: 'Dawlat Shah', ps: 'دولت شاه' }, { en: 'Qarghayi', ps: 'قرغی' },
  ]},
  { en: 'Logar', ps: 'لوګر', districts: [
    { en: 'Pul-e-Alam', ps: 'پل علم' }, { en: 'Mohammad Agha', ps: 'محمد آغه' }, { en: 'Baraki Barak', ps: 'برکي برک' },
    { en: 'Khushi', ps: 'خوشی' }, { en: 'Charkh', ps: 'څرخ' }, { en: 'Azra', ps: 'ازره' },
  ]},
  { en: 'Maidan Wardak', ps: 'میدان وردګ', districts: [
    { en: 'Maidan Shahr', ps: 'میدان ښار' }, { en: 'Nerkh', ps: 'نرخ' }, { en: 'Jalrez', ps: 'جلریز' },
    { en: 'Jaghatu', ps: 'جغتو' }, { en: 'Saydabad', ps: 'سیدآباد' }, { en: 'Day Mirdad', ps: 'دایمیرداد' }, { en: 'Chak', ps: 'چک' },
  ]},
  { en: 'Nimroz', ps: 'نیمروز', districts: [
    { en: 'Zaranj', ps: 'زرنج' }, { en: 'Chakhansur', ps: 'چهخانسور' }, { en: 'Kang', ps: 'کنگ' },
    { en: 'Char Burjak', ps: 'چهاربرجک' }, { en: 'Delaram', ps: 'دلارام' },
  ]},
  { en: 'Nuristan', ps: 'نورستان', districts: [
    { en: 'Parun', ps: 'پارون' }, { en: 'Bargi Matal', ps: 'برگیمټال' }, { en: 'Kamdesh', ps: 'کامدیش' },
    { en: 'Wama', ps: 'واما' }, { en: 'Waygal', ps: 'وایګل' }, { en: 'Nurgram', ps: 'نورګرام' }, { en: 'Du Ab', ps: 'دوآب' },
  ]},
  { en: 'Paktia', ps: 'پکتیا', districts: [
    { en: 'Gardez', ps: 'ګردیز' }, { en: 'Zurmat', ps: 'زرمت' }, { en: 'Ahmad Aba', ps: 'احمد آبا' },
    { en: 'Jani Khel', ps: 'جاني خېل' }, { en: 'Dand wa Patan', ps: 'ډنډ پټان' }, { en: 'Zadran', ps: 'ځدران' },
    { en: 'Laja Ahmad Khel', ps: 'لجه احمدخېل' },
  ]},
  { en: 'Paktika', ps: 'پکتیکا', districts: [
    { en: 'Sharana', ps: 'ښرنه' }, { en: 'Urgun', ps: 'اورګون' }, { en: 'Barmal', ps: 'برمل' },
    { en: 'Sar Hawza', ps: 'سرحوضه' }, { en: 'Gomal', ps: 'ګومل' }, { en: 'Mata Khan', ps: 'متاخان' },
    { en: 'Yosuf Khel', ps: 'یوسف خېل' }, { en: 'Khair Kot', ps: 'خیرکوټ' }, { en: 'Ziruk', ps: 'زیړوک' },
  ]},
  { en: 'Panjshir', ps: 'پنجشیر', districts: [
    { en: 'Bazarak', ps: 'بازارک' }, { en: 'Anaba', ps: 'عنابه' }, { en: 'Rokha', ps: 'روخه' },
    { en: 'Dara', ps: 'دره' }, { en: 'Shutul', ps: 'شتل' }, { en: 'Khenj', ps: 'خنج' },
  ]},
  { en: 'Parwan', ps: 'پروان', districts: [
    { en: 'Charikar', ps: 'چاریکار' }, { en: 'Bagram', ps: 'بګرام' }, { en: 'Jabal Saraj', ps: 'جبل سراج' },
    { en: 'Salang', ps: 'سالنګ' }, { en: 'Shinwari', ps: 'شینواري' }, { en: 'Koh-e-Safi', ps: 'کوه صافي' }, { en: 'Surobi', ps: 'سروبي' },
  ]},
  { en: 'Samangan', ps: 'سمنګان', districts: [
    { en: 'Aybak', ps: 'ایبک' }, { en: 'Hazrat Sultan', ps: 'حضرت سلطان' }, { en: 'Ruyi Du Ab', ps: 'روی دوآب' },
    { en: 'Dar-e-Suf Bala', ps: 'دره صوف بالا' }, { en: 'Dar-e-Suf Payin', ps: 'دره صوف پایین' }, { en: 'Feroz Nakhchir', ps: 'فیروز نخچیر' },
  ]},
  { en: 'Sar-e Pol', ps: 'سرپل', districts: [
    { en: 'Sar-e Pol City', ps: 'سرپل ښار' }, { en: 'Sayyad', ps: 'سید' }, { en: 'Kohistanat', ps: 'کوهستانات' },
    { en: 'Sancharak', ps: 'سانچارک' }, { en: 'Gosfandi', ps: 'ګوسفندي' }, { en: 'Balkhab', ps: 'بلخاب' }, { en: 'Sozmaqala', ps: 'سوزمه قلعه' },
  ]},
  { en: 'Takhar', ps: 'تخار', districts: [
    { en: 'Taloqan', ps: 'تالقان' }, { en: 'Farkhar', ps: 'فرخار' }, { en: 'Rustaq', ps: 'رستاق' },
    { en: 'Ishkamish', ps: 'اشکمش' }, { en: 'Chal', ps: 'چال' }, { en: 'Khwaja Ghar', ps: 'خواجه غار' },
    { en: 'Baharak', ps: 'بهارک' }, { en: 'Bangi', ps: 'بنګي' }, { en: 'Darqad', ps: 'درقد' },
  ]},
  { en: 'Urozgan', ps: 'اروزګان', districts: [
    { en: 'Tarinkot', ps: 'ترینکوټ' }, { en: 'Deh Rawud', ps: 'دهراوود' }, { en: 'Chora', ps: 'چوره' },
    { en: 'Gizab', ps: 'ګیزاب' }, { en: 'Shahid-e-Hassas', ps: 'شهید حساس' }, { en: 'Khas Urozgan', ps: 'خاص اروزګان' },
  ]},
  { en: 'Zabul', ps: 'زابل', districts: [
    { en: 'Qalat', ps: 'کلات' }, { en: 'Shah Joy', ps: 'شاجوی' }, { en: 'Shinkay', ps: 'شینکی' },
    { en: 'Arghandab', ps: 'ارغنداب' }, { en: 'Mizan', ps: 'میزان' }, { en: 'Daychopan', ps: 'دایچوپان' },
    { en: 'Naw Bahar', ps: 'نو بهار' }, { en: 'Atghar', ps: 'اتغر' },
  ]},
  { en: 'Kapisa', ps: 'کاپیسا', districts: [
    { en: 'Mahmud-e-Raqi', ps: 'محمود راقي' }, { en: 'Nijrab', ps: 'نجراب' }, { en: 'Tagab', ps: 'تګاب' },
    { en: 'Alasay', ps: 'اله سای' }, { en: 'Hesa Awal Kohistan', ps: 'حصه اول کوهستان' }, { en: 'Hesa Duwum Kohistan', ps: 'حصه دوم کوهستان' },
  ]},
  { en: 'Daykundi', ps: 'دایکنډي', districts: [
    { en: 'Nili', ps: 'نیلي' }, { en: 'Shahristan', ps: 'شهرستان' }, { en: 'Kajran', ps: 'کجران' },
    { en: 'Gizab', ps: 'ګیزاب' }, { en: 'Kiti', ps: 'کیتي' }, { en: 'Miramor', ps: 'میرامور' },
    { en: 'Sangtakht wa Bandar', ps: 'سنگ تخت و بندر' }, { en: 'Ashtarlay', ps: 'اشترلي' },
  ]},
];

function ComboInput({ value, onChange, suggestions, placeholder, hasError, className, ...props }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setHighlighted(0); }, [suggestions.length]);

  const select = (item) => { onChange(item.en); setOpen(false); };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); select(suggestions[highlighted]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        {...props}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          hasError && 'border-destructive',
          className,
        )}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-52 overflow-y-auto py-1">
          {suggestions.map((item, i) => (
            <li
              key={item.en}
              onMouseDown={(e) => { e.preventDefault(); select(item); }}
              onMouseEnter={() => setHighlighted(i)}
              className={cn(
                'flex items-center justify-between px-3 py-2 text-sm cursor-pointer select-none',
                i === highlighted ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
              )}
            >
              <span className="font-medium">{item.en}</span>
              <span className="text-muted-foreground text-xs" dir="rtl">{item.ps}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProvinceInput({ value, onChange, placeholder = 'Province', className, hasError, ...props }) {
  const q = (value || '').trim().toLowerCase();
  const suggestions = AFGHANISTAN.filter(
    (p) => q.length === 0 || p.en.toLowerCase().includes(q) || p.ps.includes((value || '').trim())
  );
  return (
    <ComboInput
      value={value}
      onChange={onChange}
      suggestions={suggestions}
      placeholder={placeholder}
      hasError={hasError}
      className={className}
      {...props}
    />
  );
}

export function DistrictInput({ value, onChange, province, placeholder = 'District', className, hasError, ...props }) {
  const provinceData = AFGHANISTAN.find(
    (p) => p.en.toLowerCase() === (province || '').toLowerCase() || p.ps === (province || '').trim()
  );
  const pool = provinceData ? provinceData.districts : AFGHANISTAN.flatMap((p) => p.districts);
  const q = (value || '').trim().toLowerCase();
  const suggestions = pool.filter(
    (d) => q.length === 0 || d.en.toLowerCase().includes(q) || d.ps.includes((value || '').trim())
  );
  return (
    <ComboInput
      value={value}
      onChange={onChange}
      suggestions={suggestions}
      placeholder={placeholder}
      hasError={hasError}
      className={className}
      {...props}
    />
  );
}
