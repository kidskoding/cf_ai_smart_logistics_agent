import React, { useState, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
interface Part {
  id: string;
  partNumber: string;
  description: string;
  category: string;
}
const PARTS_DATA: Part[] = [
  { id: '1', partNumber: 'RES-220K', description: '2.2k Ohm 1/4W Carbon Film Resistor', category: 'Passives' },
  { id: '2', partNumber: 'CPU-i7-13700K', description: 'Intel Core i7-13700K Processor', category: 'Processors' },
  { id: '3', partNumber: 'CAP-100UF', description: '100uF 25V Electrolytic Capacitor', category: 'Passives' },
  { id: '4', partNumber: 'MCU-STM32F4', description: 'STM32F405 ARM Cortex-M4 Microcontroller', category: 'Microcontrollers' },
  { id: '5', partNumber: 'IC-LM358', description: 'Dual Operational Amplifier IC', category: 'Analog' },
  { id: '6', partNumber: 'LED-RGB-5MM', description: '5mm RGB Common Cathode LED', category: 'Optoelectronics' },
  { id: '7', partNumber: 'MOS-IRFZ44N', description: 'N-Channel Power MOSFET 49A 55V', category: 'Discrete' },
  { id: '8', partNumber: 'REG-7805', description: '5V Positive Voltage Regulator', category: 'Power' },
  { id: '9', partNumber: 'DIO-1N4007', description: '1A 1000V General Purpose Rectifier', category: 'Discrete' },
  { id: '10', partNumber: 'ESP-WROOM-32', description: 'ESP32 WiFi + BT Module', category: 'Wireless' },
  { id: '11', partNumber: 'CON-USB-C', description: 'USB Type-C Female Connector SMT', category: 'Connectors' },
  { id: '12', partNumber: 'LCD-1602-I2C', description: '16x2 Character LCD with I2C Interface', category: 'Displays' },
  { id: '13', partNumber: 'RAM-DDR4-16G', description: '16GB DDR4 3200MHz Desktop Memory', category: 'Memory' },
  { id: '14', partNumber: 'SSD-NVME-1TB', description: '1TB NVMe M.2 PCIe Gen4 SSD', category: 'Storage' },
  { id: '15', partNumber: 'FAN-120MM-PWM', description: '120mm PWM Cooling Fan 12V', category: 'Thermal' },
  { id: '16', partNumber: 'SEN-BME280', description: 'Temperature/Humidity/Pressure Sensor', category: 'Sensors' },
  { id: '17', partNumber: 'REL-5V-1CH', description: '5V Single Channel Relay Module', category: 'Power' },
  { id: '18', partNumber: 'SW-SPDT-MINI', description: 'Miniature SPDT Toggle Switch', category: 'Electromechanical' },
  { id: '19', partNumber: 'CRY-16MHZ', description: '16MHz HC-49S Crystal Oscillator', category: 'Timing' },
  { id: '20', partNumber: 'POT-10K-LIN', description: '10k Ohm Linear Potentiometer', category: 'Passives' },
  { id: '21', partNumber: 'GPU-RTX-4070', description: 'NVIDIA GeForce RTX 4070 Graphics Card', category: 'Processors' },
  { id: '22', partNumber: 'IC-555-TMR', description: 'Precision Timer Integrated Circuit', category: 'Analog' },
  { id: '23', partNumber: 'BAT-CR2032', description: '3V Lithium Coin Cell Battery', category: 'Power' },
  { id: '24', partNumber: 'FUSE-BLADE-10A', description: '10A Automotive Blade Fuse', category: 'Protection' },
  { id: '25', partNumber: 'PCB-FR4-100X150', description: 'Double Sided FR4 Prototyping Board', category: 'Prototyping' },
  { id: '26', partNumber: 'IND-100UH-2A', description: '100uH 2A Power Inductor', category: 'Passives' },
  { id: '27', partNumber: 'BRD-UNO-R3', description: 'Arduino Uno R3 Development Board', category: 'Microcontrollers' },
  { id: '28', partNumber: 'TRANS-2N2222', description: 'NPN General Purpose Transistor TO-92', category: 'Discrete' },
  { id: '29', partNumber: 'IC-74HC595', description: '8-Bit Shift Register with Latched Output', category: 'Logic' },
  { id: '30', partNumber: 'TERM-BLOCK-2P', description: '5.08mm Pitch 2-Pin Terminal Block', category: 'Connectors' },
];
interface PartsCatalogProps {
  onSelectPart: (description: string) => void;
  className?: string;
}
export function PartsCatalog({ onSelectPart, className }: PartsCatalogProps) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Part, direction: 'asc' | 'desc' } | null>(null);
  const filteredParts = useMemo(() => {
    let result = PARTS_DATA.filter(part => 
      part.partNumber.toLowerCase().includes(search.toLowerCase()) ||
      part.description.toLowerCase().includes(search.toLowerCase()) ||
      part.category.toLowerCase().includes(search.toLowerCase())
    );
    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [search, sortConfig]);
  const toggleSort = (key: keyof Part) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  return (
    <div className={cn("flex flex-col h-full space-y-4", className)}>
      <div className="relative group px-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-sky-500 transition-colors" />
        <Input 
          placeholder="Filter inventory..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs focus-visible:ring-sky-500"
        />
      </div>
      <div className="flex-1 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
            <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-slate-800">
              <TableHead 
                className="w-[110px] cursor-pointer text-[10px] font-bold uppercase tracking-wider h-10 px-3"
                onClick={() => toggleSort('partNumber')}
              >
                <div className="flex items-center gap-1.5">
                  PN <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-[10px] font-bold uppercase tracking-wider h-10 px-3"
                onClick={() => toggleSort('description')}
              >
                <div className="flex items-center gap-1.5">
                  Description <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParts.length > 0 ? (
              filteredParts.map((part) => (
                <TableRow 
                  key={part.id} 
                  className="cursor-pointer group hover:bg-sky-50/50 dark:hover:bg-sky-900/10 transition-colors border-b border-slate-100 dark:border-slate-900"
                  onClick={() => onSelectPart(`${part.partNumber}: ${part.description}`)}
                >
                  <TableCell className="font-mono text-[11px] text-sky-600 dark:text-sky-400 font-bold py-2.5 px-3">
                    {part.partNumber}
                  </TableCell>
                  <TableCell className="text-[11px] text-slate-600 dark:text-slate-400 py-2.5 px-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate max-w-[140px]">{part.description}</span>
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 text-sky-500 transition-all transform translate-x-1 group-hover:translate-x-0" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-xs text-muted-foreground italic">
                  No parts found matching criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}