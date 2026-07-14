'use client';

import React from 'react';
import { Info, MapPin, ClipboardList, Trophy, ShieldCheck, CloudSun, Compass, Calendar, Clock, Sun, Cloud, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

function getLocalized(val, locale = 'tr') {
  if (val && typeof val === 'object') {
    return val[locale] || val['tr'] || val['en'] || Object.values(val)[0] || '';
  }
  return val || '';
}

export default function RaceDetailsTabs({ race, locale = 'tr' }) {
  const description = getLocalized(race.content || race.description, locale);
  
  // Entered metrics & route fields
  const distance = race.distance ? parseFloat(race.distance) : 0;
  const startPoint = race.start_point || '';
  const finishPoint = race.finish_point || '';
  const elevation = race.elevation ? parseInt(race.elevation, 10) : 0;
  const descent = race.descent ? parseInt(race.descent, 10) : 0;

  const raceTabs = Array.isArray(race.tabs) ? race.tabs : [];

  const [activeTab, setActiveTab] = React.useState('rules');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const [weatherData, setWeatherData] = React.useState(null);
  const [weatherLoading, setWeatherLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=36.6217&longitude=29.1164&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,rain&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&timezone=auto')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setWeatherData(data);
        }
        setWeatherLoading(false);
      })
      .catch(() => {
        setWeatherLoading(false);
      });
  }, []);

  const getWmoDetails = (code) => {
    const mappings = {
      0: { label: locale === 'tr' ? 'Açık / Güneşli' : 'Sunny / Clear', icon: Sun },
      1: { label: locale === 'tr' ? 'Çoğunlukla Açık' : 'Mainly Clear', icon: CloudSun },
      2: { label: locale === 'tr' ? 'Parçalı Bulutlu' : 'Partly Cloudy', icon: CloudSun },
      3: { label: locale === 'tr' ? 'Bulutlu' : 'Overcast', icon: Cloud },
      45: { label: locale === 'tr' ? 'Sisli' : 'Foggy', icon: Cloud },
      48: { label: locale === 'tr' ? 'Puslu Sis' : 'Rime Fog', icon: Cloud },
      51: { label: locale === 'tr' ? 'Hafif Çiseleme' : 'Light Drizzle', icon: CloudRain },
      53: { label: locale === 'tr' ? 'Çiseleyen Yağmurlu' : 'Drizzle', icon: CloudRain },
      55: { label: locale === 'tr' ? 'Yoğun Çiseleme' : 'Heavy Drizzle', icon: CloudRain },
      61: { label: locale === 'tr' ? 'Hafif Yağmurlu' : 'Slight Rain', icon: CloudRain },
      63: { label: locale === 'tr' ? 'Yağmurlu' : 'Rain', icon: CloudRain },
      65: { label: locale === 'tr' ? 'Şiddetli Yağmurlu' : 'Heavy Rain', icon: CloudRain },
      71: { label: locale === 'tr' ? 'Hafif Karlı' : 'Slight Snow', icon: CloudSnow },
      73: { label: locale === 'tr' ? 'Karlı' : 'Moderate Snow', icon: CloudSnow },
      75: { label: locale === 'tr' ? 'Yoğun Karlı' : 'Heavy Snow', icon: CloudSnow },
      80: { label: locale === 'tr' ? 'Hafif Sağanak' : 'Slight Showers', icon: CloudRain },
      81: { label: locale === 'tr' ? 'Sağanak Yağmurlu' : 'Rain Showers', icon: CloudRain },
      82: { label: locale === 'tr' ? 'Şiddetli Sağanak' : 'Violent Showers', icon: CloudRain },
      95: { label: locale === 'tr' ? 'Gökgürültülü Fırtına' : 'Thunderstorm', icon: CloudLightning },
    };
    return mappings[code] || { label: locale === 'tr' ? 'Güneşli' : 'Sunny', icon: Sun };
  };

  const getHourlyForecast = () => {
    if (!weatherData || !weatherData.hourly) return [];
    
    const hourly = weatherData.hourly;
    const list = [];
    
    // We get 3-hourly slots for 3 days (24 items total)
    for (let i = 0; i < 24; i++) {
      const idx = i * 3;
      if (idx >= hourly.time.length) break;
      
      const timeStr = hourly.time[idx];
      const date = new Date(timeStr);
      
      list.push({
        date: date,
        timeLabel: date.toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
        dayLabel: date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'short', day: 'numeric' }),
        temp: Math.round(hourly.temperature_2m[idx]),
        code: hourly.weather_code[idx],
        windSpeed: Math.round(hourly.wind_speed_10m[idx]),
        windDir: hourly.wind_direction_10m[idx],
        rain: hourly.rain[idx],
      });
    }
    return list;
  };

  const tabsData = [
    {
      id: 'rules',
      label: locale === 'tr' ? 'Yarışma Kuralları' : 'Competition Rules',
      icon: ClipboardList,
      content: (
        <div className="space-y-4">
          <div className="hidden md:flex items-center gap-2 pb-2 border-b border-border/40">
            <ClipboardList className="size-5 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'tr' ? 'Yarışma Kuralları & Katılım Şartları' : 'Rules & Entry Requirements'}
            </h3>
          </div>
          <ul className="space-y-3.5 text-sm sm:text-base text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
            <li className="flex items-start gap-2.5">
              <span className="flex items-center justify-center size-5 rounded-full bg-red-500/10 text-red-500 shrink-0 text-xs mt-0.5 font-bold">!</span>
              <span><strong>{locale === 'tr' ? 'Yaş Sınırı:' : 'Age Limit:'}</strong> {locale === 'tr' ? 'Yarışmaya katılım yaşı minimum 18’dir. 18 yaş altındaki sporcular veli izin belgesiyle katılabilir.' : 'Minimum age is 18. Athletes under 18 must present a parental consent form.'}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex items-center justify-center size-5 rounded-full bg-orange-500/10 text-orange-500 shrink-0 text-xs mt-0.5 font-bold">★</span>
              <span><strong>{locale === 'tr' ? 'Zorunlu Malzemeler:' : 'Mandatory Gear:'}</strong> {locale === 'tr' ? 'Yarış esnasında göğüs numarası görünür olmalı, acil durum kiti ve su matarası bulundurulmalıdır.' : 'Race number must be visible, emergency kit and hydration bottle are mandatory.'}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex items-center justify-center size-5 rounded-full bg-red-500/10 text-red-500 shrink-0 text-xs mt-0.5 font-bold">✗</span>
              <span><strong>{locale === 'tr' ? 'Diskalifiye Nedenleri:' : 'Disqualification:'}</strong> {locale === 'tr' ? 'Parkur dışına çıkmak, çevreye çöp atmak veya sportmenlik dışı davranışlar doğrudan ihraç sebebidir.' : 'Cutting the course, littering, or unsportsmanlike behavior will result in immediate disqualification.'}</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'program',
      label: locale === 'tr' ? 'Yarışma Programı' : 'Competition Program',
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <div className="hidden md:flex items-center gap-2 pb-2 border-b border-border/40">
            <Calendar className="size-5 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'tr' ? 'Etkinlik Programı' : 'Event Schedule'}
            </h3>
          </div>
          <div className="relative border-l border-zinc-200 dark:border-zinc-800 pl-4.5 ml-2.5 space-y-6">
            <div className="relative">
              <span className="absolute -left-7.5 top-0.5 size-5 rounded-full bg-primary border-4 border-background dark:border-zinc-950 shrink-0" />
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-black text-primary uppercase">07:00 - 08:30</span>
                <h4 className="text-sm sm:text-base font-bold text-foreground">{locale === 'tr' ? 'Sporcu Kit Dağıtımı & Kayıt Kontrol' : 'Race Kit Distribution & Check-in'}</h4>
                <p className="text-xs sm:text-sm text-zinc-500">{locale === 'tr' ? 'Yarış kitleri başlangıç noktasındaki stantlardan teslim edilecektir.' : 'Kit pickup will be available at the registration tents at the start area.'}</p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute -left-7.5 top-0.5 size-5 rounded-full bg-zinc-400 border-4 border-background dark:border-zinc-950 shrink-0" />
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-black text-zinc-500 uppercase">08:45</span>
                <h4 className="text-sm sm:text-base font-bold text-foreground">{locale === 'tr' ? 'Teknik Toplantı & Isınma' : 'Technical Briefing & Warm-up'}</h4>
                <p className="text-xs sm:text-sm text-zinc-500">{locale === 'tr' ? 'Parkur güvenliği ve son talimatlar hakkında bilgilendirme yapılacaktır.' : 'Briefing about course safety and final reminders.'}</p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute -left-7.5 top-0.5 size-5 rounded-full bg-emerald-500 border-4 border-background dark:border-zinc-950 shrink-0" />
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-black text-emerald-500 uppercase">09:00</span>
                <h4 className="text-sm sm:text-base font-bold text-foreground">{locale === 'tr' ? 'Yarış Başlangıcı (Start)' : 'Race Start'}</h4>
                <p className="text-xs sm:text-sm text-zinc-500">{locale === 'tr' ? 'Tüm kategoriler için toplu çıkış verilecektir.' : 'Mass start will be given for all categories.'}</p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute -left-7.5 top-0.5 size-5 rounded-full bg-zinc-400 border-4 border-background dark:border-zinc-950 shrink-0" />
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-black text-zinc-500 uppercase">13:00</span>
                <h4 className="text-sm sm:text-base font-bold text-foreground">{locale === 'tr' ? 'Ödül Töreni & Kapanış' : 'Awards Ceremony & Closing'}</h4>
                <p className="text-xs sm:text-sm text-zinc-500">{locale === 'tr' ? 'Dereceye giren sporculara kürsü madalya ve kupaları takdim edilecektir.' : 'Trophies and prizes will be awarded to podium finishers.'}</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'consent',
      label: locale === 'tr' ? 'Muvafakatname' : 'Consent Form',
      icon: ShieldCheck,
      content: (
        <div className="space-y-4">
          <div className="hidden md:flex items-center gap-2 pb-2 border-b border-border/40">
            <ShieldCheck className="size-5 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'tr' ? 'Muvafakatname & Sorumluluk Beyanı' : 'Consent & Release Form'}
            </h3>
          </div>
          <div className="p-4.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-border/40 text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-3 font-medium">
            <p>{locale === 'tr' ? 'Yarışmaya kendi hür irademle katıldığımı, yarış parkurunun zorluk derecesini bildiğimi ve bu mücadeleye katılmak için gerekli fiziksel ve zihinsel hazırlığa sahip olduğumu beyan ederim.' : 'I declare that I participate in the competition of my own free will, know the difficulty level of the course, and have the necessary physical and mental preparation to participate.'}</p>
            <p>{locale === 'tr' ? 'Etkinlik boyunca meydana gelebilecek herhangi bir kaza, sakatlık, sağlık problemi ya da mal kaybından dolayı organizasyon komitesini, sponsorları ve yetkilileri sorumlu tutmayacağımı kabul ve taahhüt ederim.' : 'I accept and undertake that I will not hold the organization committee, sponsors, and officials responsible for any accident, injury, health problem, or loss of property that may occur during the event.'}</p>
            <p>{locale === 'tr' ? 'Yarış sırasında sağlık ekiplerinin vereceği her türlü tıbbi karara uymayı, acil durumlarda tıbbi müdahaleyi şimdiden onayladığımı beyan ederim.' : 'I declare that I comply with all medical decisions of the medical teams during the race, and approve medical intervention in advance in case of emergencies.'}</p>
          </div>
        </div>
      )
    },
    {
      id: 'weather',
      label: locale === 'tr' ? 'Hava Durumu' : 'Weather',
      icon: CloudSun,
      content: (
        <div className="space-y-4">
          <div className="hidden md:flex items-center gap-2 pb-2 border-b border-border/40">
            <CloudSun className="size-5 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'tr' ? 'Fethiye Anlık Hava Durumu' : 'Fethiye Live Weather'}
            </h3>
          </div>
          
          {weatherLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : weatherData ? (
            (() => {
              const details = getWmoDetails(weatherData.weather_code);
              const WeatherIcon = details.icon;
              return (
                <div className="space-y-4">
                  <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                    <div className="p-4.5 rounded-xl border border-border/50 bg-zinc-50/50 dark:bg-zinc-900/20 text-center flex flex-col items-center justify-center gap-1">
                      <WeatherIcon className="size-6 text-primary shrink-0" />
                      <span className="block text-xs font-black text-zinc-400 uppercase tracking-wider mt-1">{locale === 'tr' ? 'Durum' : 'Condition'}</span>
                      <span className="text-sm font-black text-foreground">{details.label}</span>
                    </div>
                    <div className="p-4.5 rounded-xl border border-border/50 bg-zinc-50/50 dark:bg-zinc-900/20 text-center flex flex-col items-center justify-center gap-1">
                      <span className="text-2xl font-black text-foreground">{Math.round(weatherData.temperature_2m)}°C</span>
                      <span className="block text-xs font-black text-zinc-400 uppercase tracking-wider">{locale === 'tr' ? 'Sıcaklık' : 'Temperature'}</span>
                    </div>
                    <div className="p-4.5 rounded-xl border border-border/50 bg-zinc-50/50 dark:bg-zinc-900/20 text-center flex flex-col items-center justify-center gap-1">
                      <span className="text-2xl font-black text-foreground">%{weatherData.relative_humidity_2m}</span>
                      <span className="block text-xs font-black text-zinc-400 uppercase tracking-wider">{locale === 'tr' ? 'Nem' : 'Humidity'}</span>
                    </div>
                    <div className="p-4.5 rounded-xl border border-border/50 bg-zinc-50/50 dark:bg-zinc-900/20 text-center flex flex-col items-center justify-center gap-1">
                      <span className="text-2xl font-black text-foreground">{weatherData.wind_speed_10m} km/s</span>
                      <span className="block text-xs font-black text-zinc-400 uppercase tracking-wider">{locale === 'tr' ? 'Rüzgar' : 'Wind'}</span>
                    </div>
                  </div>

                  {/* Native 3-Day Hourly Forecast Timeline */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                      {locale === 'tr' ? '3 Günlük Detaylı Saatlik Tahmin' : '3-Day Detailed Hourly Forecast'}
                    </h4>
                    <div className="border border-border/80 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/10 overflow-x-auto scrollbar-thin flex divide-x divide-border/60 shadow-inner">
                      {getHourlyForecast().map((slot, index) => {
                        const wmo = getWmoDetails(slot.code);
                        const SlotIcon = wmo.icon;
                        return (
                          <div key={index} className="flex-shrink-0 w-24 p-4 flex flex-col items-center gap-3.5 text-center hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors duration-150">
                            {/* Day & Time */}
                            <div className="space-y-0.5">
                              <span className="block text-[9px] font-black text-zinc-400 uppercase tracking-wide">{slot.dayLabel}</span>
                              <span className="block text-[11px] font-black text-foreground">{slot.timeLabel}</span>
                            </div>

                            {/* Weather Icon with tooltip */}
                            <div className="relative group/tooltip">
                              <SlotIcon className="size-5.5 text-primary shrink-0 transition-transform duration-300 hover:scale-110" />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[9px] font-bold text-white bg-zinc-950 rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap shadow-md z-30">
                                {wmo.label}
                              </span>
                            </div>

                            {/* Temperature */}
                            <span className="text-xs font-black text-foreground">{slot.temp}°C</span>

                            {/* Rain (if any) */}
                            <div className="text-[10px] font-extrabold text-zinc-500 flex items-center justify-center gap-0.5">
                              <span className="text-[10px]">💧</span>
                              <span>{slot.rain > 0 ? `${slot.rain} mm` : '-'}</span>
                            </div>

                            {/* Wind Speed and Dynamic Direction Arrow */}
                            <div className="space-y-1">
                              <span className="block text-[10px] font-bold text-zinc-500">{slot.windSpeed} km/s</span>
                              <div className="flex justify-center">
                                <span 
                                  className="inline-block text-[10px] font-black text-primary transition-transform duration-300"
                                  style={{ transform: `rotate(${slot.windDir}deg)` }}
                                  title={`${slot.windDir}°`}
                                >
                                  ↑
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Windy Interactive Map - clean view (detail panel hidden) */}
                  <div className="space-y-3 pt-4">
                    <h4 className="text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                      {locale === 'tr' ? 'Canlı Rüzgar & Hava Durumu Haritası' : 'Live Wind & Weather Map'}
                    </h4>
                    <div className="relative w-full h-[360px] sm:h-[420px] rounded-2xl overflow-hidden border border-border/80 bg-zinc-950/10 shadow-sm">
                      <iframe 
                        src="https://embed.windy.com/embed.html?lat=36.6217&lon=29.1164&detailLat=36.6217&detailLon=29.1164&zoom=10&level=surface&overlay=wind&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=false&metricWind=km%2Fh&metricTemp=default&radarRange=-1"
                        className="w-full h-full border-0"
                        title="Windy Weather Map"
                        allowFullScreen
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-400 mt-2 font-medium">
                    💡 <em>{locale === 'tr' ? 'Not: Canlı rüzgar haritası Windy.com, saatlik detaylı tahmin verileri ise Open-Meteo API üzerinden Fethiye bölgesi için anlık sunulmaktadır.' : 'Note: Live wind map is powered by Windy.com, and hourly forecast data is fetched via Open-Meteo API for the Fethiye region.'}</em>
                  </p>
                </div>
              );
            })()
          ) : (
            <div className="text-center py-6 text-zinc-500 text-xs font-bold">
              {locale === 'tr' ? 'Hava durumu bilgisi yüklenemedi.' : 'Failed to load weather info.'}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'transportation',
      label: locale === 'tr' ? 'Ulaşım' : 'Transportation',
      icon: Compass,
      content: (
        <div className="space-y-4">
          <div className="hidden md:flex items-center gap-2 pb-2 border-b border-border/40">
            <Compass className="size-5 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'tr' ? 'Ulaşım & Otopark Bilgileri' : 'Transportation & Parking'}
            </h3>
          </div>
          <div className="space-y-4 text-sm sm:text-base text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
            <div className="flex gap-3">
              <div className="size-7 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm mt-0.5">🚌</div>
              <div>
                <h4 className="font-bold text-foreground text-xs sm:text-sm uppercase tracking-wide">{locale === 'tr' ? 'Toplu Taşıma / Servisler' : 'Public Transport / Shuttles'}</h4>
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">{locale === 'tr' ? 'Yarış sabahı saat 07:15’te belediye binası önünden ücretsiz sporcu servisleri kaldırılacaktır.' : 'Free athlete shuttles will depart from the city hall at 07:15 AM on race morning.'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="size-7 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm mt-0.5">🚗</div>
              <div>
                <h4 className="font-bold text-foreground text-xs sm:text-sm uppercase tracking-wide">{locale === 'tr' ? 'Özel Araç & Otopark' : 'Private Vehicles & Parking'}</h4>
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">{locale === 'tr' ? 'Yarış başlangıç noktasının 100m ilerisinde yer alan ücretsiz açık otopark alanını kullanabilirsiniz.' : 'Free public parking is available 100m from the race start gate area.'}</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const activeTabData = tabsData.find(t => t.id === activeTab) || tabsData[0];
  const ActiveIcon = activeTabData.icon;

  return (
    <div className="w-full space-y-10">
      {/* 1. Genel Açıklama, Girilen Veriler & Neler Dahil */}
      {(description || distance > 0 || startPoint || finishPoint || elevation > 0 || descent > 0 || race.whats_included) && (
        <div className="space-y-6 py-2">
          
          {description && (
            <div 
              className="prose prose-zinc dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line text-sm sm:text-base"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}

          {/* Entered specifications list right above What's Included */}
          {(distance > 0 || startPoint || finishPoint || elevation > 0 || descent > 0) && (
            <div className="pt-6 border-t border-border/40 grid gap-6 grid-cols-1 sm:grid-cols-3">
              {distance > 0 && (
                <div className="flex items-start gap-2.5">
                  <Trophy className="size-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[11px] font-black uppercase text-zinc-400 tracking-wider">
                      {locale === 'tr' ? 'MESAFE' : 'DISTANCE'}
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-100">
                      {distance} KM
                    </span>
                  </div>
                </div>
              )}
              {startPoint && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="size-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[11px] font-black uppercase text-zinc-400 tracking-wider">
                      {locale === 'tr' ? 'BAŞLANGIÇ NOKTASI' : 'START POINT'}
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-100">
                      {startPoint}
                    </span>
                  </div>
                </div>
              )}
              {finishPoint && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="size-5 text-zinc-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[11px] font-black uppercase text-zinc-400 tracking-wider">
                      {locale === 'tr' ? 'BİTİŞ NOKTASI' : 'FINISH POINT'}
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-100">
                      {finishPoint}
                    </span>
                  </div>
                </div>
              )}
              {elevation > 0 && (
                <div className="flex items-start gap-2.5">
                  <div className="size-5 text-primary shrink-0 font-black text-sm mt-0.5">▲</div>
                  <div>
                    <span className="block text-[11px] font-black uppercase text-zinc-400 tracking-wider">
                      {locale === 'tr' ? 'YÜKSEKLİK KAZANIMI' : 'ELEVATION GAIN'}
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-100">
                      +{elevation} M
                    </span>
                  </div>
                </div>
              )}
              {descent > 0 && (
                <div className="flex items-start gap-2.5">
                  <div className="size-5 text-zinc-500 shrink-0 font-black text-sm mt-0.5">▼</div>
                  <div>
                    <span className="block text-[11px] font-black uppercase text-zinc-400 tracking-wider">
                      {locale === 'tr' ? 'YÜKSEKLİK KAYBI' : 'ELEVATION LOSS'}
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-100">
                      -{descent} M
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {race.whats_included && (
            <div className="pt-6 border-t border-border/40 space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-primary shrink-0" />
                <span className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  {locale === 'tr' ? 'YARIŞA NELER DAHİL?' : 'WHAT\'S INCLUDED IN THE REGISTRATION?'}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(() => {
                  const items = getLocalized(race.whats_included, locale);
                  const itemsArray = Array.isArray(items) ? items : (Array.isArray(race.whats_included) ? race.whats_included : []);
                  return itemsArray.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      <span className="flex items-center justify-center size-5 rounded-full bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span>{item}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Divider line between Description and Tabs System */}
      {(description || distance > 0 || startPoint || finishPoint || elevation > 0 || descent > 0 || race.whats_included) && (
        <div className="h-px bg-zinc-200/60 dark:bg-zinc-800/60" />
      )}

      {/* 2. Mock Data Tabs System - Desktop (md:block) */}
      <div className="hidden md:block space-y-6">
        {/* Horizontal Tab Buttons Bar for Desktop View */}
        <div className="flex border-b border-border/60 bg-zinc-50/50 dark:bg-zinc-900/10 overflow-x-auto no-scrollbar rounded-xl">
          {tabsData.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-primary bg-background/50'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <Icon className={`size-4 shrink-0 ${isActive ? 'text-primary' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="py-4">
          {tabsData.map((tab) => {
            if (activeTab !== tab.id) return null;
            return (
              <div key={tab.id} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                {tab.content}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Mock Data Tabs System - Mobile (md:hidden) */}
      <div className="md:hidden">
        <Accordion type="single" collapsible className="space-y-3">
          {tabsData.map((tab) => {
            const Icon = tab.icon;
            return (
              <AccordionItem key={tab.id} value={tab.id} className="border border-border/50 bg-zinc-50/50 dark:bg-zinc-900/10 rounded-xl overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-4 px-4 flex items-center justify-between text-xs font-black uppercase tracking-wider text-foreground group">
                  <div className="flex items-center gap-2.5">
                    <Icon className="size-4.5 text-primary shrink-0" />
                    <span>{tab.label}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-background border-t border-border/40">
                  {tab.content}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* 3. Özel Sekmeler (Custom Sections) */}
      {raceTabs.map((tab, idx) => (
        <div key={idx} className="space-y-6 py-2">
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2 pb-3 border-b border-border/60">
            <ClipboardList className="size-4.5 text-primary" />
            <span>{getLocalized(tab.title, locale)}</span>
          </h2>
          <div 
            className="prose prose-zinc dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm"
            dangerouslySetInnerHTML={{ __html: getLocalized(tab.content, locale) }}
          />
        </div>
      ))}
    </div>
  );
}
