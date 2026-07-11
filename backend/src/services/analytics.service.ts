import { Seat } from '../models/Seat';
import { Floor } from '../models/Floor';
import { Booking } from '../models/Booking';

export class AnalyticsService {
  /**
   * Retrieves live occupancy metrics and seat status counts across floors.
   */
  static async getOccupancyStats() {
    // Current seat status breakdown globally
    const statusCounts = await Seat.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Breakdown counts per floor
    const floorCounts = await Seat.aggregate([
      {
        $group: {
          _id: '$floorId',
          totalSeats: { $sum: 1 },
          occupiedSeats: {
            $sum: {
              $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0]
            }
          },
          reservedSeats: {
            $sum: {
              $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0]
            }
          },
          vacantSeats: {
            $sum: {
              $cond: [{ $eq: ['$status', 'vacant'] }, 1, 0]
            }
          },
          maintenanceSeats: {
            $sum: {
              $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0]
            }
          },
          offlineSeats: {
            $sum: {
              $cond: [{ $eq: ['$status', 'offline'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Fetch floor names for clean mapping
    const floors = await Floor.find({});
    const floorMap = new Map(floors.map((f) => [f._id.toString(), f]));

    const floorStats = floorCounts.map((stat) => {
      const floorObj = floorMap.get(stat._id.toString());
      return {
        floorId: stat._id,
        floorName: floorObj ? floorObj.name : 'Unknown',
        floorNumber: floorObj ? floorObj.floorNumber : 0,
        totalSeats: stat.totalSeats,
        occupiedSeats: stat.occupiedSeats,
        reservedSeats: stat.reservedSeats,
        vacantSeats: stat.vacantSeats,
        maintenanceSeats: stat.maintenanceSeats,
        offlineSeats: stat.offlineSeats,
        occupancyRate: stat.totalSeats > 0 ? parseFloat(((stat.occupiedSeats / stat.totalSeats) * 100).toFixed(2)) : 0
      };
    });

    return {
      statusBreakdown: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, { vacant: 0, occupied: 0, reserved: 0, maintenance: 0, offline: 0 } as Record<string, number>),
      floorStats
    };
  }

  /**
   * Generates reservation summaries and hourly usage trends.
   */
  static async getBookingStats() {
    const totalBookings = await Booking.countDocuments();

    // Breakdown by reservation status
    const statusBreakdown = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Hourly trends: group by startTime hour of the day
    const hourlyTrends = await Booking.aggregate([
      {
        $project: {
          hour: { $hour: { date: '$startTime', timezone: 'UTC' } }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Pre-populate missing hours with 0 counts to prevent chart index gaps
    const hourMap = new Map(hourlyTrends.map((t) => [t._id, t.count]));
    const completeHourlyTrends = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourMap.get(i) || 0
    }));

    return {
      totalBookings,
      statusStats: statusBreakdown.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, { pending: 0, active: 0, completed: 0, cancelled: 0, 'no-show': 0 } as Record<string, number>),
      hourlyTrends: completeHourlyTrends
    };
  }

  /**
   * Generates a sanitised CSV payload string containing all booking records.
   */
  static async exportBookingsCSV(): Promise<string> {
    const bookings = await Booking.find({})
      .populate('studentId', 'name email')
      .populate('seatId', 'seatNumber roomName')
      .sort({ startTime: -1 });

    const rows = [
      ['Booking ID', 'Student Name', 'Student Email', 'Seat Number', 'Room Name', 'Start Time', 'End Time', 'Status', 'Check-In Time', 'Check-Out Time']
    ];

    for (const b of bookings) {
      const student = b.studentId as any;
      const seat = b.seatId as any;

      rows.push([
        b._id.toString(),
        student ? student.name : 'N/A',
        student ? student.email : 'N/A',
        seat ? seat.seatNumber : 'N/A',
        seat ? seat.roomName : 'N/A',
        b.startTime ? new Date(b.startTime).toISOString() : '',
        b.endTime ? new Date(b.endTime).toISOString() : '',
        b.status,
        b.checkInTime ? new Date(b.checkInTime).toISOString() : '',
        b.checkOutTime ? new Date(b.checkOutTime).toISOString() : ''
      ]);
    }

    // Safely wrap fields in quotes and escape double-quotes to prevent CSV injection
    return rows.map((row) =>
      row.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')
    ).join('\r\n');
  }
}
