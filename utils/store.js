import { reactive, computed } from 'vue';

export const backtestStore = reactive({
    backtests: [],
    selectedBacktestId: null,
    selectedBacktest: null,
    selectedTradeIndex: -1,
    selectedInstrumentId: null,
    selectedInstrumentDesc: null,
    selectedCycleId: null,
    loading: false,

    get currentTrade() {
        if (!this.selectedBacktest) return null;
        const trades = this.selectedBacktest.tradeCycles;

        // 1. Specific Trade/Execution View
        if (this.selectedTradeIndex !== -1) {
            const t = trades[this.selectedTradeIndex];
            if (!t) return null;
            return {
                ...t,
                instrumentId: t.symbol,
                instrumentDesc: t.description,
                tradeCycles: [t], // Standardized to list
                isSingleTradeView: true
            };
        }

        // 2. Cycle-level View (Aggregates multiple executions/chunks)
        if (this.selectedCycleId && this.selectedInstrumentId) {
            const instrId = this.selectedInstrumentId;
            const cycleTrades = trades.filter(t => {
                return t.symbol === instrId && t.cycleId === this.selectedCycleId;
            });

            if (cycleTrades.length > 0) {
                return {
                    instrumentId: instrId,
                    instrumentDesc: this.selectedInstrumentDesc || instrId,
                    tradeCycles: cycleTrades,
                    isCycleView: true
                };
            }
        }

        // 3. Instrument-level View (Aggregates all cycles)
        if (this.selectedInstrumentId) {
            const instrId = this.selectedInstrumentId;

            // SPECIAL CASE: Session Overview (Nifty)
            if (instrId === 'OVERVIEW') {
                return {
                    instrumentId: 26000,
                    instrumentDesc: 'Session Overview (Nifty)',
                    tradeCycles: trades,
                    isOverview: true,
                    isInstrumentView: true, // Use same layout as instrument view
                    backtestRange: {
                        start: this.selectedBacktest.config?.startDate,
                        end: this.selectedBacktest.config?.endDate
                    }
                };
            }

            const instrumentTrades = trades.filter(t => {
                return t.symbol === this.selectedInstrumentId;
            });
            if (instrumentTrades.length === 0) return null;

            return {
                instrumentId: instrId,
                instrumentDesc: this.selectedInstrumentDesc,
                tradeCycles: instrumentTrades,
                isInstrumentView: true,
                backtestRange: {
                    start: this.selectedBacktest.config?.startDate,
                    end: this.selectedBacktest.config?.endDate
                }
            };
        }

        return null;
    },

    async fetchBacktests() {
        this.loading = true;
        try {
            const res = await fetch('/api/backtests');
            if (res.ok) {
                this.backtests = await res.json();
                // If we have backtests but none selected, select the first one if on an analysis route
                if (this.backtests.length > 0 && !this.selectedBacktestId) {
                    // Logic to handle auto-selection could go here if desired, 
                    // but usually AppShell handles it or we wait for user.
                }
            }
        } catch (e) {
            console.error('Failed to fetch backtests:', e);
        } finally {
            this.loading = false;
        }
    },

    async selectBacktest(sessionId) {
        if (!sessionId) {
            this.selectedBacktest = null;
            this.selectedBacktestId = null;
            this.selectedTradeIndex = -1;
            this.selectedInstrumentId = null;
            this.selectedInstrumentDesc = null;
            this.selectedCycleId = null;
            return;
        }
        this.selectedBacktestId = sessionId;
        this.selectedInstrumentId = null;
        this.selectedInstrumentDesc = null;
        this.selectedCycleId = null;
        this.selectedTradeIndex = -1;
        this.loading = true;
        try {
            const res = await fetch(`/api/backtests/${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                if (data && Object.keys(data).length > 0) {
                    this.selectedBacktest = data;
                    // Default to Session Overview (+ all instruments aggregated)
                    this.selectedInstrumentId = 'OVERVIEW';
                    this.selectedInstrumentDesc = 'Session Overview (Nifty)';
                    this.selectedTradeIndex = -1;
                } else {
                    console.warn(`Backtest details empty for Session: ${sessionId}`);
                    this.selectedBacktest = null;
                    this.selectedTradeIndex = -1;
                }
            }
        } catch (e) {
            console.error('Failed to fetch backtest details:', e);
            this.selectedBacktest = null;
            this.selectedTradeIndex = -1;
        } finally {
            this.loading = false;
        }
    }
});
