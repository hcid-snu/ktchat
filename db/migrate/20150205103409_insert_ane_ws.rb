class InsertAneWs < ActiveRecord::Migration

  def up
    require 'csv'
    anews_csv = CSV.read('public/BRM-emot-submit.csv')
    anews_csv.each_with_index  do |row, i|
      if i>0
        AffectiveNorm.create(name: row[1], valence: row[2], arousal: row[5], dominance: row[8])
      end
    end
  end
  def down
    AffectiveNorm.destroy_all
  end
end
