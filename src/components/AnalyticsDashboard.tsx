'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, Beer, Clock, Award, BarChart3 } from 'lucide-react';

interface AnalyticsData {
  overview: {
    tastingId: string;
    title: string;
    status: string;
    totalParticipants: number;
    totalBeers: number;
    finishedBeers: number;
    totalRatings: number;
    overallAverage: number;
    averageTimePerBeer: number | null;
  };
  ratingDistribution: Record<string, number>;
  beerTimings: Array<{
    beerId: string;
    name: string;
    durationMinutes: number;
  }>;
  beerParticipation: Array<{
    beerId: string;
    name: string;
    brewery: string;
    status: string;
    ratingsCount: number;
    totalParticipants: number;
    participationRate: number;
  }>;
  topRatedBeers: Array<{
    beerId: string;
    name: string;
    brewery: string;
    average: number;
    ratingsCount: number;
    status: string;
  }>;
  participantStats: Array<{
    participantId: string;
    userName: string;
    code: string;
    ratingsCount: number;
    possibleRatings: number;
    engagementRate: number;
  }>;
}

interface AnalyticsDashboardProps {
  tastingId: string;
}

export function AnalyticsDashboard({ tastingId }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [tastingId]);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/tastings/${tastingId}/analytics`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Hleður tölfræði...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Engin tölfræðigögn tiltæk
      </div>
    );
  }

  const { overview, ratingDistribution, beerTimings, beerParticipation, topRatedBeers, participantStats } = data;

  // Calculate max value for rating distribution chart
  const maxRatingCount = Math.max(...Object.values(ratingDistribution));

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">Þátttakendur</span>
          </div>
          <div className="text-2xl font-bold">{overview.totalParticipants}</div>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Beer className="h-4 w-4" />
            <span className="text-sm">Bjórar smakkaðir</span>
          </div>
          <div className="text-2xl font-bold">{overview.finishedBeers} / {overview.totalBeers}</div>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Fjöldi einkunnna</span>
          </div>
          <div className="text-2xl font-bold">{overview.totalRatings}</div>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Award className="h-4 w-4" />
            <span className="text-sm">Heildarmeðaltal</span>
          </div>
          <div className="text-2xl font-bold">{overview.overallAverage.toFixed(2)}</div>
        </div>
      </div>

      {/* Average Time Per Beer */}
      {overview.averageTimePerBeer && (
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Meðaltími á hvern bjór</h3>
          </div>
          <div className="text-3xl font-bold text-primary">{overview.averageTimePerBeer} mínútur</div>
        </div>
      )}

      {/* Top Rated Beers */}
      {topRatedBeers.length > 0 && (
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Bestu bjórarnir
          </h3>
          <div className="space-y-2">
            {topRatedBeers.slice(0, 5).map((beer, index) => (
              <div key={beer.beerId} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </span>
                  <div>
                    <div className="font-medium text-sm">{beer.name}</div>
                    <div className="text-xs text-muted-foreground">{beer.brewery}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">{beer.average}</div>
                  <div className="text-xs text-muted-foreground">{beer.ratingsCount} einkunnir</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      <div className="bg-card p-4 rounded-lg border">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Dreifing einkunna
        </h3>
        <div className="space-y-1">
          {Object.entries(ratingDistribution)
            .reverse()
            .filter(([_, count]) => count > 0)
            .map(([rating, count]) => {
              const percentage = maxRatingCount > 0 ? (count / maxRatingCount) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm font-mono w-8 text-right">{rating}</span>
                  <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-primary h-full flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    >
                      {count > 0 && (
                        <span className="text-xs font-semibold text-primary-foreground">{count}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Beer Participation Rates */}
      {beerParticipation.length > 0 && (
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="font-semibold mb-3">Þátttökuhlutfall bjóra</h3>
          <div className="space-y-2">
            {beerParticipation.map((beer) => (
              <div key={beer.beerId} className="p-2 bg-muted/50 rounded">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="font-medium text-sm">{beer.name}</div>
                    <div className="text-xs text-muted-foreground">{beer.brewery}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{beer.participationRate}%</div>
                    <div className="text-xs text-muted-foreground">
                      {beer.ratingsCount}/{beer.totalParticipants}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${beer.participationRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participant Engagement */}
      {participantStats.length > 0 && (
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Þátttaka
          </h3>
          <div className="space-y-2">
            {participantStats.map((participant) => (
              <div key={participant.participantId} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div>
                  <div className="font-medium text-sm">{participant.userName}</div>
                  <div className="text-xs text-muted-foreground">Kóði: {participant.code}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{participant.engagementRate}%</div>
                  <div className="text-xs text-muted-foreground">
                    {participant.ratingsCount}/{participant.possibleRatings} gefið einkunn
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Beer Timings */}
      {beerTimings.length > 0 && (
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tími á hvern bjór
          </h3>
          <div className="space-y-2">
            {beerTimings.map((timing) => (
              <div key={timing.beerId} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="font-medium text-sm">{timing.name}</div>
                <div className="text-sm font-semibold text-primary">{timing.durationMinutes} mín</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
