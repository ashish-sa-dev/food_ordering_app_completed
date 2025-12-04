import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './not-found.html',
  styleUrls: ['./not-found.css'],
})
export class NotFound implements OnInit {
  searchQuery: string = '';
  currentTime: Date = new Date();
  currentYear: number = new Date().getFullYear();

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Update time every minute
    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  goBack(): void {
    window.history.back();
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      // In a real app, you would navigate to search results

      // this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });

      // For demo, show alert
      alert(`Searching for: ${this.searchQuery}\n(Search functionality would be implemented here)`);
    }
  }

  contactSupport(): void {
    // In a real app, this could open a contact form or email client
    const subject = encodeURIComponent('404 Error Report');
    const body = encodeURIComponent(
      `I encountered a 404 error on page: ${window.location.href}\n\nDetails:`,
    );
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`, '_blank');
  }
}
