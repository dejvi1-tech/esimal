import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CountryPage from './CountryPage';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('CountryPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows country packages if found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([{ id: '1', name: 'Test', country_name: 'Albania', data_amount: 1, days: 7, sale_price: 10 }]),
    });
    render(
      <MemoryRouter initialEntries={["/country/albania"]}>
        <Routes>
          <Route path="/country/:country" element={<CountryPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText(/Albania/i)).toBeInTheDocument();
    expect(screen.getByText(/€10.00/)).toBeInTheDocument();
  });

  it('falls back to region if no country packages', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // country
      .mockResolvedValueOnce({ ok: true, json: async () => ([{ id: '2', name: 'Test', country_name: 'Europe', data_amount: 2, days: 14, sale_price: 20 }]) }); // region
    render(
      <MemoryRouter initialEntries={["/country/europe"]}>
        <Routes>
          <Route path="/country/:country" element={<CountryPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText(/Europe/i)).toBeInTheDocument();
    expect(screen.getByText(/€20.00/)).toBeInTheDocument();
  });

  it('shows empty state if neither country nor region has packages', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // country
      .mockResolvedValueOnce({ ok: true, json: async () => [] }); // region
    render(
      <MemoryRouter initialEntries={["/country/unknown"]}>
        <Routes>
          <Route path="/country/:country" element={<CountryPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText(/No offers for "unknown"/i)).toBeInTheDocument();
  });

  it('shows error banner on fetch error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fail'));
    render(
      <MemoryRouter initialEntries={["/country/albania"]}>
        <Routes>
          <Route path="/country/:country" element={<CountryPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText(/couldn't load packages/i)).toBeInTheDocument();
  });
}); 