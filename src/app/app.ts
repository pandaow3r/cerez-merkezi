import { Component, signal, inject } from '@angular/core';
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
    return Math.ceil(this.events?.length || 0 / this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  loading: boolean = false;
  error: string | null = null;

  private http = inject(HttpClient);

  onSearch(event: Event) {
    event.preventDefault();
    this.events = [];
    this.error = null;
    this.loading = true; // Yükleniyor hemen başlasın
    this.currentPage = 1;
    const apiKey = '6s20YXGCGRq5xtMg56hiJcJHk8aYHa0U';
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?classificationName=music&city=${encodeURIComponent(this.city)}&apikey=${apiKey}`;
    this.http.get<any>(url).subscribe({
      next: (response) => {
        const events = response?._embedded?.events || [];
        this.events = events.map((ev: any) => ({
          title: ev.name || '',
          description: ev.info || ev.pleaseNote || '',
          date: ev.dates?.start?.localDate || '',
          location: ev._embedded?.venues?.[0]?.name || '',
          url: ev.url || '',
          image: ev.images?.[0]?.url || ''
        }));
        this.loading = false; // Veri gelir gelmez loading kapansın
      },
      error: (err) => {
        this.error = 'Etkinlikler alınırken bir hata oluştu.';
        this.loading = false;
      }
    });
  }
}
