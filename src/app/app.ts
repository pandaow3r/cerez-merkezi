import { Component, signal, inject, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, CommonModule, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('cerez-merkezi');

  city: string = '';
  events: Array<{ title?: string; description?: string; date?: string; location?: string; url?: string; image?: string }> | undefined = undefined;
  currentPage: number = 1;
  pageSize: number = 6;

  get pagedEvents() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.events?.slice(start, start + this.pageSize) || [];
  }

  get totalPages() {
    return Math.ceil((this.events?.length || 0) / this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  loading: boolean = false;
  error: string | null = null;
  refresh = 0;

  theme: 'light' | 'dark' = 'light';

  constructor() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        this.theme = 'dark';
        document.body.classList.add('dark-theme');
      } else {
        this.theme = 'light';
        document.body.classList.remove('dark-theme');
      }
    }
  }

  toggleTheme() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      if (this.theme === 'light') {
        this.theme = 'dark';
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        this.theme = 'light';
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
      }
    }
  }

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);

  onSearch(event: Event) {
    event.preventDefault();
    // En güncel input değerini DOM'dan al
    const form = event.target as HTMLFormElement;
    const input = form.querySelector('input[name="city"]') as HTMLInputElement;
    const city = input ? input.value : this.city;
    if (!city || city.trim() === '') {
      this.error = 'Lütfen bir şehir adı girin.';
      this.events = undefined;
      this.cdr.detectChanges();
      this.appRef.tick();
      this.refresh++;
      return;
    }
    this.city = city;
    this.events = undefined;
    this.error = null;
    this.loading = true;
    this.currentPage = 1;
    const apiKey = '6s20YXGCGRq5xtMg56hiJcJHk8aYHa0U';
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?classificationName=music&city=${encodeURIComponent(city)}&apikey=${apiKey}`;
    this.http.get<any>(url).subscribe({
      next: (response) => {
        const events = response?._embedded?.events || [];
        if (events.length === 0) {
          this.error = 'Bu şehir için etkinlik bulunamadı.';
          this.events = undefined;
          this.loading = false;
          this.cdr.detectChanges();
          this.appRef.tick();
          this.refresh++;
          return;
        }
        this.events = events.map((ev: any) => ({
          title: ev.name || '',
          description: ev.info || ev.pleaseNote || '',
          date: ev.dates?.start?.localDate || '',
          location: ev._embedded?.venues?.[0]?.name || '',
          url: ev.url || '',
          image: ev.images?.[0]?.url || ''
        }));
        this.loading = false;
        this.cdr.detectChanges();
        this.appRef.tick();
        this.refresh++;
      },
      error: (err) => {
        this.error = 'Etkinlikler alınırken bir hata oluştu.';
        this.loading = false;
        this.cdr.detectChanges();
        this.appRef.tick();
        this.refresh++;
      }
    });
  }

  onInput(event: Event) {
    this.city = (event.target as HTMLInputElement).value;
  }
}
