"""
Crypto Price Service for MINEX GLOBAL Platform
Using CoinGecko API for real-time cryptocurrency prices
"""
import os
import logging
import aiohttp
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import asyncio

logger = logging.getLogger(__name__)

class CryptoPriceService:
    BASE_URL = "https://api.coingecko.com/api/v3"
    
    # Supported cryptocurrencies
    SUPPORTED_COINS = {
        'bitcoin': 'BTC',
        'ethereum': 'ETH',
        'tether': 'USDT',
        'binancecoin': 'BNB',
        'solana': 'SOL',
        'ripple': 'XRP',
        'cardano': 'ADA',
        'dogecoin': 'DOGE',
        'polkadot': 'DOT',
        'avalanche-2': 'AVAX',
        'chainlink': 'LINK',
        'litecoin': 'LTC'
    }
    
    def __init__(self):
        self.cache: Dict[str, dict] = {}
        self.cache_duration = timedelta(minutes=1)  # Cache for 1 minute
        self.last_fetch: Optional[datetime] = None
        
    async def _fetch_prices(self) -> Dict[str, dict]:
        """Fetch prices from CoinGecko API"""
        try:
            coin_ids = ','.join(self.SUPPORTED_COINS.keys())
            url = f"{self.BASE_URL}/simple/price"
            params = {
                'ids': coin_ids,
                'vs_currencies': 'usd',
                'include_24hr_change': 'true',
                'include_market_cap': 'true'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data
                    else:
                        logger.error(f"CoinGecko API error: {response.status}")
                        return {}
        except asyncio.TimeoutError:
            logger.error("CoinGecko API timeout")
            return {}
        except Exception as e:
            logger.error(f"Error fetching crypto prices: {str(e)}")
            return {}
    
    async def get_prices(self) -> List[dict]:
        """Get cryptocurrency prices with caching"""
        now = datetime.utcnow()
        
        # Check if cache is valid
        if self.last_fetch and (now - self.last_fetch) < self.cache_duration and self.cache:
            return self._format_prices(self.cache)
        
        # Fetch new prices
        raw_prices = await self._fetch_prices()
        
        if raw_prices:
            self.cache = raw_prices
            self.last_fetch = now
            return self._format_prices(raw_prices)
        
        # Return cached data if fetch failed
        if self.cache:
            return self._format_prices(self.cache)
        
        # Return default data if no cache available
        return self._get_default_prices()
    
    def _format_prices(self, raw_prices: Dict[str, dict]) -> List[dict]:
        """Format prices for frontend consumption"""
        formatted = []
        
        for coin_id, symbol in self.SUPPORTED_COINS.items():
            if coin_id in raw_prices:
                price_data = raw_prices[coin_id]
                price = price_data.get('usd', 0)
                change_24h = price_data.get('usd_24h_change', 0)
                
                # Format price based on value
                if price >= 1000:
                    price_str = f"${price:,.0f}"
                elif price >= 1:
                    price_str = f"${price:,.2f}"
                else:
                    price_str = f"${price:.4f}"
                
                # Format change
                change_str = f"{change_24h:+.2f}%"
                
                formatted.append({
                    'name': symbol,
                    'full_name': coin_id.replace('-', ' ').title(),
                    'price': price_str,
                    'price_raw': price,
                    'change': change_str,
                    'change_raw': change_24h,
                    'positive': change_24h >= 0
                })
        
        return formatted
    
    def _get_default_prices(self) -> List[dict]:
        """Return default prices when API is unavailable"""
        return [
            {'name': 'BTC', 'price': '$67,500.00', 'change': '+2.34%', 'positive': True},
            {'name': 'ETH', 'price': '$3,450.00', 'change': '+1.89%', 'positive': True},
            {'name': 'USDT', 'price': '$1.00', 'change': '+0.01%', 'positive': True},
            {'name': 'BNB', 'price': '$580.00', 'change': '-0.52%', 'positive': False},
            {'name': 'SOL', 'price': '$145.00', 'change': '+5.67%', 'positive': True},
            {'name': 'XRP', 'price': '$0.52', 'change': '+3.21%', 'positive': True},
            {'name': 'ADA', 'price': '$0.45', 'change': '+1.45%', 'positive': True},
            {'name': 'DOGE', 'price': '$0.12', 'change': '-1.23%', 'positive': False},
        ]


# Global instance
crypto_service = CryptoPriceService()
