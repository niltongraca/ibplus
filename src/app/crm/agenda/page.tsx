"use client";

import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, X } from "lucide-react";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: string;
}

const eventTypes: Record<string, { label: string; color: string }> = {
  meeting: { label: "Reunião", color: "bg-blue-100 text-blue-700 border-blue-200" },
  call: { label: "Chamada", color: "bg-green-100 text-green-700 border-green-200" },
  visit: { label: "Visita", color: "bg-purple-100 text-purple-700 border-purple-200" },
  other: { label: "Outro", color: "bg-gray-100 text-gray-700 border-gray-200" },
};

export default function AgendaPage() {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [form, setForm] = useState({ title: "", time: "09:00", type: "meeting" });

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  }

  function getEventsForDay(day: number) {
    return events.filter((e) => {
      const d = new Date(e.date);
      return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }

  function handleDayClick(day: number) {
    setSelectedDate(new Date(currentYear, currentMonth, day));
    setShowForm(true);
  }

  function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !form.title) return;
    const newEvent: Event = {
      id: Date.now().toString(),
      title: form.title,
      date: selectedDate,
      time: form.time,
      type: form.type,
    };
    setEvents([...events, newEvent]);
    setShowForm(false);
    setForm({ title: "", time: "09:00", type: "meeting" });
  }

  function removeEvent(id: string) {
    setEvents(events.filter((ev) => ev.id !== id));
  }

  const dayEvents = selectedDate ? getEventsForDay(selectedDate.getDate()) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Agenda</h1>
          <p className="text-ib-muted text-sm">Calendário de compromissos e eventos</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5 text-ib-muted" /></button>
            <h2 className="text-lg font-bold text-ib-primary">{monthNames[currentMonth]} {currentYear}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-5 h-5 text-ib-muted" /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((d) => (
              <span key={d} className="text-xs text-ib-muted text-center font-medium py-2">{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
              const dayEvts = getEventsForDay(day);
              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`relative p-2 text-sm rounded-lg transition-colors min-h-[44px] ${
                    isToday ? "bg-ib-accent text-white font-bold" : "hover:bg-gray-50 text-ib-primary"
                  } ${selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth ? "ring-2 ring-ib-accent" : ""}`}
                >
                  <span>{day}</span>
                  {dayEvts.length > 0 && (
                    <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isToday ? "bg-white" : "bg-ib-accent"}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ib-primary">
              {selectedDate ? `${selectedDate.getDate()} de ${monthNames[selectedDate.getMonth()]}` : "Seleccione um dia"}
            </h3>
            {selectedDate && (
              <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-xs text-ib-accent font-medium hover:underline">
                <Plus className="w-3 h-3" /> Novo
              </button>
            )}
          </div>

          {showForm && selectedDate && (
            <form onSubmit={addEvent} className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" placeholder="Título" />
              <div className="grid grid-cols-2 gap-2">
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded text-sm" />
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded text-sm bg-white">
                  {Object.entries(eventTypes).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-3 py-1.5 bg-ib-accent text-white rounded text-xs font-medium hover:bg-ib-accent/90">Adicionar</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-ib-muted hover:text-ib-primary">Cancelar</button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {dayEvents.length === 0 && (
              <p className="text-sm text-ib-muted text-center py-8">Nenhum evento neste dia.</p>
            )}
            {dayEvents.map((ev) => (
              <div key={ev.id} className={`rounded-lg border px-3 py-2.5 ${eventTypes[ev.type]?.color || eventTypes.other.color}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{ev.title}</p>
                    <span className="text-xs opacity-75 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{ev.time}</span>
                  </div>
                  <button onClick={() => removeEvent(ev.id)} className="opacity-50 hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
