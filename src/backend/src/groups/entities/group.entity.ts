import {
  Column,
  Entity,
  OneToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GroupMember } from './group-member.entity.js';
import { MemberStatus } from './member-status.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { Committee } from '../../committees/entities/committee.entity.js';
import { Activity } from '../../activities/entities/activity.entity.js';

@Entity('group')
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @OneToMany('GroupMember', 'group')
  groupMembers: GroupMember[];

  @OneToMany('MemberStatus', 'group')
  memberStatuses: MemberStatus[];

  @OneToOne('User', 'group')
  user: User | null;

  @OneToMany('Activity', 'group')
  activities: Activity[];

  @OneToMany('Committee', 'group')
  committees: Committee[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
