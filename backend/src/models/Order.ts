import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Package } from './Package';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  ACTIVATED = 'activated',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @ManyToOne(() => Package, pkg => pkg.orders)
  @JoinColumn({ name: 'packageId' })
  package!: Package;

  @Column()
  packageId!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Column({ nullable: true })
  stripePaymentId!: string;

  @Column({ nullable: true })
  stripeCustomerId!: string;

  @Column({ nullable: true })
  eSimActivationCode!: string;

  @Column({ type: 'timestamp', nullable: true })
  activatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 