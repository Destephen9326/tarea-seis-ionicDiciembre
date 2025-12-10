import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardsPagePage } from './cards-page.page';

describe('CardsPagePage', () => {
  let component: CardsPagePage;
  let fixture: ComponentFixture<CardsPagePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CardsPagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
